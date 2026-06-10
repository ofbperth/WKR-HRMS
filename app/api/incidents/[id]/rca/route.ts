import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyRmTeam } from "@/lib/notifications";
import { rcaSchema } from "@/lib/validators";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { canManageIncident, canSubmitRca } from "@/lib/rbac";
import { encryptedRcaNarrative } from "@/lib/sensitive-fields";
import { invalidateSmartCache } from "@/lib/smart-cache";

export const preferredRegion = "sin1";

function removeSensitiveRcaStorage<T extends Record<string, any>>(rca: T) {
  const { rcaEncrypted, ...rest } = rca;
  return rest;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    if (!canSubmitRca(user.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const input = rcaSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({ where: { id: params.id }, include: { rca: true } });
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canManageIncident(user.role) && !canUnitManageIncident(user, incident)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"].includes(incident.status)) return Response.json({ error: "RCA_NOT_ALLOWED_FOR_STATUS" }, { status: 409 });

    const submittedAt = input.submit ? new Date() : incident.rca?.submittedAt ?? null;
    const status = input.submit ? "Submitted" : incident.rca?.status ?? "Draft";
    const rcaEncrypted = encryptedRcaNarrative(input);
    const rca = await prisma.rCA.upsert({
      where: { incidentId: params.id },
      update: {
        problemStatement: input.problemStatement.trim(),
        timeline: input.timeline?.trim() || null,
        contributingHuman: input.contributingHuman?.trim() || null,
        contributingProcess: input.contributingProcess?.trim() || null,
        contributingEquipment: input.contributingEquipment?.trim() || null,
        contributingEnvironment: input.contributingEnvironment?.trim() || null,
        contributingCommunication: input.contributingCommunication?.trim() || null,
        contributingIT: input.contributingIT?.trim() || null,
        rootCause: input.rootCause.trim(),
        rcaEncrypted,
        preventiveAction: input.preventiveAction.trim(),
        kpi: input.kpi?.trim() || null,
        kpiOwnerId: input.kpiOwnerId || null,
        needRmSupport: input.needRmSupport,
        status,
        submittedAt,
      } as any,
      create: {
        incidentId: params.id,
        problemStatement: input.problemStatement.trim(),
        timeline: input.timeline?.trim() || null,
        contributingHuman: input.contributingHuman?.trim() || null,
        contributingProcess: input.contributingProcess?.trim() || null,
        contributingEquipment: input.contributingEquipment?.trim() || null,
        contributingEnvironment: input.contributingEnvironment?.trim() || null,
        contributingCommunication: input.contributingCommunication?.trim() || null,
        contributingIT: input.contributingIT?.trim() || null,
        rootCause: input.rootCause.trim(),
        rcaEncrypted,
        preventiveAction: input.preventiveAction.trim(),
        kpi: input.kpi?.trim() || null,
        kpiOwnerId: input.kpiOwnerId || null,
        needRmSupport: input.needRmSupport,
        status,
        submittedAt,
      } as any,
    });
    await auditLog({ userId: user.id, role: user.role, action: input.submit ? "submit rca" : "save rca", entityType: "RCA", entityId: rca.id, newValue: { incidentId: params.id, status } });
    if (input.submit) {
      await prisma.incident.update({ where: { id: params.id }, data: { status: "RCASubmitted" } });
      await notifyRmTeam({ type: "rca-submitted", title: "RCA submitted", message: `${incident.incidentNo} is ready for RM approval`, relatedIncidentId: params.id });
    }
    await invalidateSmartCache();
    return Response.json(removeSensitiveRcaStorage(rca));
  } catch (error) {
    return apiError(error);
  }
}
