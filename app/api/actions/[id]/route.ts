import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyRmTeam } from "@/lib/notifications";
import { actionUpdateSchema } from "@/lib/validators";
import { canUnitManageIncident, canWorkAsOwner } from "@/lib/workflow-permissions";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const input = actionUpdateSchema.parse(await request.json());
    const existing = await prisma.actionPlan.findUnique({ where: { id: params.id }, include: { incident: true } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const canReassignOwner = user.role === "Admin" || user.role === "RMTeam" || canUnitManageIncident(user, existing.incident);
    if (!canWorkAsOwner(user, existing) && user.role !== "RMTeam" && !canReassignOwner) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (existing.status === "Verified") return Response.json({ error: "ACTION_ALREADY_VERIFIED" }, { status: 409 });
    const ownerId = canReassignOwner && input.ownerId !== undefined ? input.ownerId || null : existing.ownerId;

    const updated = await prisma.actionPlan.update({
      where: { id: params.id },
      data: {
        ownerId: ownerId as any,
        status: input.status,
        evidenceText: input.evidenceText?.trim() || null,
        evidenceUrl: input.evidenceUrl?.trim() || null,
        kpiResult: input.kpiResult?.trim() || null,
        effectivenessReview: input.effectivenessReview?.trim() || existing.effectivenessReview,
      },
    });
    if (input.status === "Done") await prisma.incident.update({ where: { id: existing.incidentId }, data: { status: "WaitingVerification" } });
    await auditLog({ userId: user.id, action: "update action", entityType: "ActionPlan", entityId: params.id, oldValue: existing, newValue: updated });
    if (ownerId && ownerId !== existing.ownerId) await prisma.notification.create({ data: { userId: ownerId, type: "action-assigned", title: "Action assigned", message: `${existing.incident.incidentNo}: ${existing.title}`, relatedIncidentId: existing.incidentId } });
    if (input.status === "Done") await notifyRmTeam({ type: "action-done", title: "Action ready for verification", message: `${existing.incident.incidentNo}: ${existing.title}`, relatedIncidentId: existing.incidentId });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}

