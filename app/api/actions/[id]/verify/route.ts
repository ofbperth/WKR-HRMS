import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { actionVerifySchema } from "@/lib/validators";
import { isIncidentClosed } from "@/lib/incident-close";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const input = actionVerifySchema.parse(await request.json());
    const existing = await prisma.actionPlan.findUnique({ where: { id: params.id }, include: { incident: true } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (isIncidentClosed(existing.incident)) return Response.json({ error: "INCIDENT_CLOSED_READ_ONLY" }, { status: 409 });
    if (existing.status !== "Done" && input.verified) return Response.json({ error: "ACTION_MUST_BE_DONE" }, { status: 409 });

    const updated = await prisma.actionPlan.update({
      where: { id: params.id },
      data: {
        status: input.verified ? "Verified" : "Ongoing",
        effectivenessReview: input.effectivenessReview?.trim() || existing.effectivenessReview,
        verifiedById: input.verified ? user.id : null,
        verifiedAt: input.verified ? new Date() : null,
      },
    });
    const remaining = await prisma.actionPlan.count({ where: { incidentId: existing.incidentId, status: { not: "Verified" } } });
    await prisma.incident.update({ where: { id: existing.incidentId }, data: { status: input.verified && remaining === 0 ? "WaitingVerification" : "ActionOngoing" } });
    await auditLog({ userId: user.id, action: input.verified ? "verify action" : "reject action verification", entityType: "ActionPlan", entityId: params.id, oldValue: existing, newValue: updated });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}

