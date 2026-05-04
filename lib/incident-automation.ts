import type { Prisma } from "@prisma/client";
import type { Severity } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyRmTeam, notifyRoles } from "@/lib/notifications";
import { createIncidentSchema } from "@/lib/validators";

function resolveAutomation(severity: Severity) {
  if (["G", "H", "I"].includes(severity)) return { status: "RCARequired" as const, isSentinel: true };
  if (["E", "F"].includes(severity)) return { status: "RCARequired" as const, isSentinel: false };
  return { status: "New" as const, isSentinel: false };
}

async function generateIncidentNo(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `RM-${year}-`;
  const count = await tx.incident.count({ where: { incidentNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function createIncidentWithAutomation(raw: unknown, currentUser: { id: string; unitId: string | null; name: string }) {
  const input = createIncidentSchema.parse(raw);
  if (!currentUser.unitId) throw new Error("USER_UNIT_REQUIRED");
  const occurredAt = new Date(`${input.occurredDate}T${input.occurredTime}:00`);
  if (Number.isNaN(occurredAt.getTime())) throw new Error("INVALID_OCCURRED_AT");
  const auto = resolveAutomation(input.severity);

  const incident = await prisma.$transaction(async tx => {
    const incidentNo = await generateIncidentNo(tx);
    const created = await tx.incident.create({
      data: {
        incidentNo,
        reportedAt: new Date(),
        occurredAt,
        reportedById: currentUser.id,
        reporterUnitId: currentUser.unitId!,
        incidentUnitId: input.incidentUnitId,
        location: input.location?.trim() || null,
        patientHn: input.patientHn?.trim() || null,
        affectedType: input.affectedType,
        clinicalOrGeneral: input.clinicalOrGeneral,
        simpleCategory: input.simpleCategory.trim(),
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
    });
    await tx.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "create incident",
        entityType: "Incident",
        entityId: created.id,
        newValue: JSON.stringify({ incidentNo: created.incidentNo, severity: created.severity, status: created.status, isSentinel: created.isSentinel, needRmSupport: created.needRmSupport }),
      },
    });
    if (auto.isSentinel) {
      await tx.auditLog.create({
        data: { userId: currentUser.id, action: "mark sentinel", entityType: "Incident", entityId: created.id, newValue: JSON.stringify({ isSentinel: true, severity: created.severity }) },
      });
    }
    return created;
  });

  const notificationTitle = auto.isSentinel ? "Sentinel event ใหม่" : "Incident ใหม่";
  const notificationMessage = `${incident.incidentNo} ${incident.title} (${incident.severity}) จาก ${incident.incidentUnit.name}`;
  if (auto.isSentinel) {
    await notifyRoles(["RMTeam", "Executive", "Admin"], { type: "sentinel", title: notificationTitle, message: notificationMessage, relatedIncidentId: incident.id });
  } else {
    await notifyRmTeam({ type: "incident", title: notificationTitle, message: notificationMessage, relatedIncidentId: incident.id });
  }
  if (input.needRmSupport) {
    await notifyRmTeam({ type: "rm-support", title: "ขอความช่วยเหลือจาก RM", message: `${incident.incidentNo} ต้องการ RM support`, relatedIncidentId: incident.id });
  }
  if (["E", "F", "G", "H", "I"].includes(input.severity)) {
    await auditLog({ userId: currentUser.id, action: "automation require rca", entityType: "Incident", entityId: incident.id, newValue: { severity: input.severity, status: auto.status } });
  }
  return incident;
}
