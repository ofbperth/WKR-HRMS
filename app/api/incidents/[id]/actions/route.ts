import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { actionPlanSchema } from "@/lib/validators";
import { canUnitManageIncident } from "@/lib/workflow-permissions";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "Admin"]);
    const input = actionPlanSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({ where: { id: params.id }, include: { rca: true } });
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (user.role !== "Admin" && !canUnitManageIncident(user, incident)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!incident.rca || incident.rca.status !== "Approved") return Response.json({ error: "RCA_APPROVAL_REQUIRED" }, { status: 409 });
    const dueDate = new Date(`${input.dueDate}T00:00:00`);
    if (Number.isNaN(dueDate.getTime())) return Response.json({ error: "INVALID_DUE_DATE" }, { status: 400 });

    const action = await prisma.actionPlan.create({
      data: {
        incidentId: params.id,
        rcaId: incident.rca.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        ownerId: input.ownerId,
        coOwnerText: input.coOwnerText?.trim() || null,
        dueDate,
        kpiName: input.kpiName?.trim() || null,
        kpiTarget: input.kpiTarget?.trim() || null,
      },
    });
    await prisma.incident.update({ where: { id: params.id }, data: { status: "ActionOngoing" } });
    await auditLog({ userId: user.id, action: "create action", entityType: "ActionPlan", entityId: action.id, newValue: { incidentId: params.id, ownerId: input.ownerId } });
    await prisma.notification.create({ data: { userId: input.ownerId, type: "action-assigned", title: "Action assigned", message: `${incident.incidentNo}: ${action.title}`, relatedIncidentId: params.id } });
    return Response.json(action, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

