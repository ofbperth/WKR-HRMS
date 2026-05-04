import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateIncidentClassificationSchema, reporterUpdateIncidentSchema } from "@/lib/validators";
import { auditLog } from "@/lib/audit";
import { getIncidentForUser } from "@/lib/incident-query";
import { canManageIncident } from "@/lib/rbac";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const incident = await getIncidentForUser(params.id, user);
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(incident);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "RMTeam", "Admin"]);
    const existing = await prisma.incident.findUnique({ where: { id: params.id } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

    if (canManageIncident(user.role)) {
      const input = updateIncidentClassificationSchema.parse(await request.json());
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
      return Response.json(updated);
    }

    if (user.role === "Reporter") {
      if (existing.reportedById !== user.id) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
      if (existing.status !== "New") return Response.json({ error: "แก้ไขได้เฉพาะ status = New" }, { status: 409 });
      const input = reporterUpdateIncidentSchema.parse({ ...(await request.json()), id: params.id });
      const occurredAt = input.occurredDate && input.occurredTime ? new Date(`${input.occurredDate}T${input.occurredTime}:00`) : existing.occurredAt;
      const updated = await prisma.incident.update({ where: { id: params.id }, data: {
        occurredAt,
        incidentUnitId: input.incidentUnitId ?? existing.incidentUnitId,
        location: input.location?.trim() ?? existing.location,
        patientHn: input.patientHn?.trim() ?? existing.patientHn,
        affectedType: input.affectedType ?? existing.affectedType,
        title: input.title?.trim() ?? existing.title,
        description: input.description?.trim() ?? existing.description,
        immediateAction: input.immediateAction?.trim() ?? existing.immediateAction,
        clinicalOrGeneral: input.clinicalOrGeneral ?? existing.clinicalOrGeneral,
        simpleCategory: input.simpleCategory?.trim() ?? existing.simpleCategory,
        riskCodeId: input.riskCodeId ?? existing.riskCodeId,
        severity: input.severity ?? existing.severity,
        needRmSupport: input.needRmSupport ?? existing.needRmSupport,
      } });
      await auditLog({ userId: user.id, action: "update incident", entityType: "Incident", entityId: params.id, oldValue: existing, newValue: updated });
      return Response.json(updated);
    }
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  } catch (error) {
    return apiError(error);
  }
}
