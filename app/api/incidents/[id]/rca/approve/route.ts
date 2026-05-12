import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { rcaApprovalSchema } from "@/lib/validators";
import { canApproveRca } from "@/lib/rbac";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    if (!canApproveRca(user.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const input = rcaApprovalSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({ where: { id: params.id }, include: { rca: true } });
    if (!incident?.rca) return Response.json({ error: "RCA_NOT_FOUND" }, { status: 404 });
    if (incident.rca.status !== "Submitted" && input.approved) return Response.json({ error: "RCA_MUST_BE_SUBMITTED" }, { status: 409 });

    const [rca] = await prisma.$transaction([
      prisma.rCA.update({
        where: { incidentId: params.id },
        data: {
          status: input.approved ? "Approved" : "RevisionRequired",
          approvedById: input.approved ? user.id : null,
          approvedAt: input.approved ? new Date() : null,
        },
      }),
      prisma.incident.update({
        where: { id: params.id },
        data: { status: input.approved ? "ActionOngoing" : "RCARequired", reviewedById: user.id, reviewedAt: new Date() },
      }),
    ]);
    await auditLog({ userId: user.id, action: input.approved ? "approve rca" : "request rca revision", entityType: "RCA", entityId: rca.id, newValue: { incidentId: params.id, comment: input.comment ?? null } });
    const unitUsers = await prisma.user.findMany({ where: { isActive: true, OR: [{ role: "Admin" }, { role: "UnitManager", unitId: incident.incidentUnitId }] }, select: { id: true } });
    if (unitUsers.length > 0) {
      await prisma.notification.createMany({
        data: unitUsers.map((u: { id: string }) => ({
          userId: u.id,
          type: input.approved ? "rca-approved" : "rca-revision",
          title: input.approved ? "RCA approved" : "RCA revision requested",
          message: `${incident.incidentNo}: ${input.approved ? "create action plan" : "please revise RCA"}`,
          relatedIncidentId: params.id,
        })),
      });
    }
    return Response.json(rca);
  } catch (error) {
    return apiError(error);
  }
}
