import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { canCloseIncident } from "@/lib/incident-close";
import { prisma } from "@/lib/prisma";
import { invalidateSmartCache } from "@/lib/smart-cache";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const existing = await prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        rca: { select: { status: true } },
        actionPlans: { select: { status: true } },
      },
    });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canCloseIncident(existing)) return Response.json({ error: "INCIDENT_NOT_READY_TO_CLOSE" }, { status: 409 });

    const updated = await prisma.incident.update({
      where: { id: params.id },
      data: {
        status: "Closed",
        closedById: user.id,
        closedAt: new Date(),
      },
    });
    await auditLog({
      userId: user.id,
      role: user.role,
      action: "close incident",
      entityType: "Incident",
      entityId: params.id,
      oldValue: existing.status,
      newValue: "Closed",
    });
    await invalidateSmartCache();
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
