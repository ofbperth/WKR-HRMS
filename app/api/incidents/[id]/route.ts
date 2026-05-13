import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateIncidentClassificationSchema, reporterUpdateIncidentSchema } from "@/lib/validators";
import { auditLog } from "@/lib/audit";
import { getIncidentForUser, removeSensitiveIncidentIdentifiers } from "@/lib/incident-query";
import { canManageIncident } from "@/lib/rbac";
import { severityOptionsFor } from "@/lib/severity";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { encryptedIncidentIdentifiers } from "@/lib/sensitive-fields";
import { invalidateSmartCache } from "@/lib/smart-cache";
import type { Role } from "@/lib/types";

function canEditIncidentDetails(user: { id: string; role: Role; unitId: string | null }, incident: { reportedById: string | null; incidentUnitId: string }) {
  return canManageIncident(user.role) || user.id === incident.reportedById || canUnitManageIncident(user, incident);
}

function isRcaSubmittedOrBeyond(incident: { status: string; rca?: { status: string } | null }) {
  return ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"].includes(incident.status) || ["Submitted", "Approved"].includes(incident.rca?.status ?? "");
}

function isIncidentDetailUpdate(input: Record<string, unknown>) {
  return ["occurredDate", "occurredTime", "incidentUnitId", "location", "affectedType", "title", "description", "immediateAction", "clinicalOrGeneral", "medicationRight"].some(key => key in input);
}

function normalizeIncidentDetailBody(input: Record<string, unknown>) {
  return {
    ...input,
    location: input.location === "" ? null : input.location,
    immediateAction: input.immediateAction === "" ? null : input.immediateAction,
    medicationRight: input.medicationRight === "" ? null : input.medicationRight,
    patientHn: input.patientHn === "" ? null : input.patientHn,
    patientAn: input.patientAn === "" ? null : input.patientAn,
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const incident = await getIncidentForUser(params.id, user);
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    await auditLog({ userId: user.id, role: user.role, action: "VIEW_INCIDENT", entityType: "Incident", entityId: params.id });
    return Response.json(removeSensitiveIncidentIdentifiers(incident));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const existing = await prisma.incident.findUnique({ where: { id: params.id }, include: { actionPlans: true, rca: true } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canManageIncident(user.role) && !canUnitManageIncident(user, existing)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (existing.reviewedAt && user.role === "UnitManager") return Response.json({ error: "TRIAGE_ALREADY_SUBMITTED" }, { status: 409 });

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "REJECT_DELETE_INCIDENT",
          entityType: "Incident",
          entityId: existing.id,
          oldValue: JSON.stringify({ incidentNo: existing.incidentNo, title: existing.title, status: existing.status, severity: existing.severity }),
        },
      });
      await tx.incident.update({
        where: { id: existing.id },
        data: {
          status: "Rejected",
          lifecycleStatus: "SOFT_DELETED",
          deletedAt: new Date(),
        } as any,
      });
    });
    await invalidateSmartCache();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const body = await request.json();
    const existing = await prisma.incident.findUnique({ where: { id: params.id }, include: { rca: { select: { status: true } } } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

    if (isIncidentDetailUpdate(body)) {
      if (!canEditIncidentDetails(user, existing)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
      if (isRcaSubmittedOrBeyond(existing)) return Response.json({ error: "INCIDENT_LOCKED_AFTER_RCA_SUBMITTED" }, { status: 409 });
      const input = reporterUpdateIncidentSchema.parse({ ...normalizeIncidentDetailBody(body), id: params.id });
      const targetType = input.clinicalOrGeneral ?? existing.clinicalOrGeneral;
      const targetRiskCodeId = input.riskCodeId ?? existing.riskCodeId;
      const targetSeverity = input.severity ?? existing.severity;
      const riskCode = await prisma.riskCode.findUnique({ where: { id: targetRiskCodeId } });
      if (!riskCode || riskCode.clinicalOrGeneral !== targetType) return Response.json({ error: "INVALID_RISK_CODE_FOR_INCIDENT_TYPE" }, { status: 400 });
      if (!(severityOptionsFor(targetType) as readonly string[]).includes(targetSeverity)) return Response.json({ error: "INVALID_SEVERITY_FOR_INCIDENT_TYPE" }, { status: 400 });
      const occurredAt = input.occurredDate && input.occurredTime ? new Date(`${input.occurredDate}T${input.occurredTime}:00`) : existing.occurredAt;
      const updateData: any = {
        occurredAt,
        incidentUnitId: input.incidentUnitId ?? existing.incidentUnitId,
        location: input.location?.trim() ?? existing.location,
        patientHn: input.patientHn === undefined ? existing.patientHn : null,
        patientAn: input.patientAn === undefined ? (existing as any).patientAn : null,
        ...(input.patientHn !== undefined || input.patientAn !== undefined
          ? encryptedIncidentIdentifiers({
              patientHn: input.patientHn ?? existing.patientHn,
              patientAn: input.patientAn ?? (existing as any).patientAn,
              reporterName: user.name,
            })
          : {}),
        medicationRight: input.medicationRight ?? (existing as any).medicationRight,
        affectedType: input.affectedType ?? existing.affectedType,
        title: input.title?.trim() ?? existing.title,
        description: input.description?.trim() ?? existing.description,
        immediateAction: input.immediateAction?.trim() ?? existing.immediateAction,
        clinicalOrGeneral: input.clinicalOrGeneral ?? existing.clinicalOrGeneral,
        simpleCategory: input.simpleCategory?.trim() ?? existing.simpleCategory,
        riskCodeId: input.riskCodeId ?? existing.riskCodeId,
        severity: input.severity ?? existing.severity,
        needRmSupport: input.needRmSupport ?? existing.needRmSupport,
      };
      const updated = await prisma.incident.update({ where: { id: params.id }, data: updateData });
      await auditLog({ userId: user.id, role: user.role, action: "update incident details", entityType: "Incident", entityId: params.id, oldValue: existing, newValue: updated });
      await invalidateSmartCache();
      return Response.json(removeSensitiveIncidentIdentifiers(updated));
    }

    if (canManageIncident(user.role)) {
      const input = updateIncidentClassificationSchema.parse(body);
      const riskCode = await prisma.riskCode.findUnique({ where: { id: input.riskCodeId } });
      if (!riskCode || riskCode.clinicalOrGeneral !== existing.clinicalOrGeneral) return Response.json({ error: "INVALID_RISK_CODE_FOR_INCIDENT_TYPE" }, { status: 400 });
      if (!(severityOptionsFor(existing.clinicalOrGeneral) as readonly string[]).includes(input.severity)) return Response.json({ error: "INVALID_SEVERITY_FOR_INCIDENT_TYPE" }, { status: 400 });
      if (input.status === "Closed") {
        const openActions = await prisma.actionPlan.count({ where: { incidentId: params.id, status: { not: "Verified" } } });
        if (openActions > 0) return Response.json({ error: "VERIFY_ALL_ACTIONS_BEFORE_CLOSE" }, { status: 409 });
      }
      const updated = await prisma.incident.update({
        where: { id: params.id },
        data: {
          severity: input.severity,
          riskCodeId: input.riskCodeId,
          simpleCategory: input.simpleCategory,
          status: input.status,
          isSentinel: input.isSentinel,
          needRmSupport: input.needRmSupport,
          reviewedById: user.id,
          reviewedAt: new Date(),
          closedById: input.status === "Closed" ? user.id : existing.closedById,
          closedAt: input.status === "Closed" ? new Date() : existing.closedAt,
        },
      });
      const changes: Record<string, unknown> = {};
      for (const key of ["severity", "riskCodeId", "simpleCategory", "status", "isSentinel", "needRmSupport"] as const) {
        if (String(existing[key]) !== String(input[key])) changes[key] = { from: existing[key], to: input[key] };
      }
      await auditLog({ userId: user.id, action: "update incident", entityType: "Incident", entityId: params.id, oldValue: existing, newValue: changes });
      if (existing.severity !== input.severity) await auditLog({ userId: user.id, action: "change severity", entityType: "Incident", entityId: params.id, oldValue: existing.severity, newValue: input.severity });
      if (existing.riskCodeId !== input.riskCodeId) await auditLog({ userId: user.id, action: "change risk code", entityType: "Incident", entityId: params.id, oldValue: existing.riskCodeId, newValue: input.riskCodeId });
      if (existing.status !== input.status) await auditLog({ userId: user.id, action: "change status", entityType: "Incident", entityId: params.id, oldValue: existing.status, newValue: input.status });
      if (existing.isSentinel !== input.isSentinel) await auditLog({ userId: user.id, action: "mark sentinel", entityType: "Incident", entityId: params.id, oldValue: existing.isSentinel, newValue: input.isSentinel });
      await invalidateSmartCache();
      return Response.json(removeSensitiveIncidentIdentifiers(updated));
    }

    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  } catch (error) {
    return apiError(error);
  }
}
