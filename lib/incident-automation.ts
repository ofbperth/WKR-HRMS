import { Prisma } from "@prisma/client";
import type { Severity } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { auditLog, writeAuditLog } from "@/lib/audit";
import { notifyRmTeam, notifyRoles } from "@/lib/notifications";
import { isHighSeverityForType, isSentinelSeverity, severityOptionsFor } from "@/lib/severity";
import { createIncidentSchema } from "@/lib/validators";
import { encryptedIncidentIdentifiers } from "@/lib/sensitive-fields";
import { invalidateSmartCache } from "@/lib/smart-cache";
import { calculateRcaDueAt } from "@/lib/rca-due-date";
import { generateIncidentNo } from "@/lib/incident-number";
export { generateIncidentNo } from "@/lib/incident-number";

function resolveAutomation(severity: Severity, clinicalOrGeneral: string) {
  if (isSentinelSeverity(severity, clinicalOrGeneral)) return { status: "RCARequired" as const, isSentinel: true };
  if (isHighSeverityForType(severity, clinicalOrGeneral)) return { status: "RCARequired" as const, isSentinel: false };
  return { status: "New" as const, isSentinel: false };
}

function isIncidentNoConflict(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes("incidentNo") : String(target ?? "").includes("incidentNo");
}

async function runPostCreateTask(label: string, task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error(`Incident post-create task failed: ${label}`, error);
  }
}

export async function createIncidentWithAutomation(raw: unknown, currentUser: { id: string; unitId: string | null; name: string }) {
  const input = createIncidentSchema.parse(raw);
  if (!currentUser.unitId) throw new Error("USER_UNIT_REQUIRED");
  const riskCode = await prisma.riskCode.findUnique({ where: { id: input.riskCodeId } });
  if (!riskCode || !riskCode.isActive) throw new Error("INVALID_RISK_CODE");
  if (riskCode.clinicalOrGeneral !== input.clinicalOrGeneral) throw new Error("RISK_CODE_TYPE_MISMATCH");
  if (!(severityOptionsFor(input.clinicalOrGeneral) as readonly string[]).includes(input.severity)) throw new Error("INVALID_SEVERITY_FOR_TYPE");
  const occurredAt = new Date(`${input.occurredDate}T${input.occurredTime}:00`);
  if (Number.isNaN(occurredAt.getTime())) throw new Error("INVALID_OCCURRED_AT");
  const auto = resolveAutomation(input.severity, input.clinicalOrGeneral);
  const reportedAt = new Date();
  const rcaDueAt = calculateRcaDueAt(input.severity, reportedAt);

  let incident: any;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      incident = await prisma.$transaction(async (tx) => {
        const incidentNo = await generateIncidentNo(tx);
        const created = await tx.incident.create({
          data: {
            incidentNo,
            reportedAt,
            occurredAt,
            rcaDueAt,
            reportedById: currentUser.id,
            reporterUnitId: currentUser.unitId!,
            incidentUnitId: input.incidentUnitId,
            location: input.location?.trim() || null,
            patientHn: null,
            patientAn: null,
            ...encryptedIncidentIdentifiers({
              patientHn: input.patientHn,
              patientAn: input.patientAn,
              reporterName: currentUser.name,
            }),
            medicationRight: input.medicationRight || null,
            affectedType: input.affectedType,
            clinicalOrGeneral: input.clinicalOrGeneral,
            simpleCategory: riskCode.simpleCategory,
            riskCodeId: input.riskCodeId,
            title: input.title.trim(),
            description: input.description.trim(),
            immediateAction: input.immediateAction?.trim() || null,
            severity: input.severity,
            isSentinel: auto.isSentinel,
            needRmSupport: input.needRmSupport,
            status: auto.status,
          },
          include: { riskCode: true, incidentUnit: true, reportedBy: true },
        } as any);
        await writeAuditLog(tx as any, {
          userId: currentUser.id,
          action: "create incident",
          entityType: "Incident",
          entityId: created.id,
          newValue: { incidentNo: created.incidentNo, severity: created.severity, status: created.status, isSentinel: created.isSentinel, needRmSupport: created.needRmSupport, rcaDueAt: (created as any).rcaDueAt },
        });
        if (auto.isSentinel) {
          await writeAuditLog(tx as any, {
            userId: currentUser.id,
            action: "mark sentinel",
            entityType: "Incident",
            entityId: created.id,
            newValue: { isSentinel: true, severity: created.severity },
          });
        }
        return created as any;
      });
      break;
    } catch (error) {
      if (attempt < 3 && isIncidentNoConflict(error)) continue;
      throw error;
    }
  }

  const notificationTitle = incident.isSentinel ? "Sentinel event ใหม่" : "Incident ใหม่";
  const notificationMessage = `${incident.incidentNo} ${incident.title} (${incident.severity}) จาก ${incident.incidentUnit.name}`;
  if (incident.isSentinel) {
    await runPostCreateTask("notify sentinel roles", () =>
      notifyRoles(["RMTeam", "Executive", "Admin"], { type: "sentinel", title: notificationTitle, message: notificationMessage, relatedIncidentId: incident.id })
    );
  } else {
    await runPostCreateTask("notify RM team", () =>
      notifyRmTeam({ type: "incident", title: notificationTitle, message: notificationMessage, relatedIncidentId: incident.id })
    );
  }
  if (input.needRmSupport) {
    await runPostCreateTask("notify RM support", () =>
      notifyRmTeam({ type: "rm-support", title: "ขอความช่วยเหลือจาก RM", message: `${incident.incidentNo} ต้องการ RM support`, relatedIncidentId: incident.id })
    );
  }
  if (isHighSeverityForType(input.severity, input.clinicalOrGeneral)) {
    await runPostCreateTask("audit RCA automation", () =>
      auditLog({ userId: currentUser.id, action: "automation require rca", entityType: "Incident", entityId: incident.id, newValue: { severity: input.severity, status: auto.status } })
    );
  }
  await runPostCreateTask("invalidate smart cache", () => invalidateSmartCache());
  return incident;
}
