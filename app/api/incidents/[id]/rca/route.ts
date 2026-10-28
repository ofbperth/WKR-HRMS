import { isIncidentReadOnly } from "@/lib/incident-close";
import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyRmTeam } from "@/lib/notifications";
import { rcaSchema } from "@/lib/validators";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { canManageIncident, canSubmitRca } from "@/lib/rbac";
import { encryptedRcaNarrative } from "@/lib/sensitive-fields";
import { invalidateSmartCache } from "@/lib/smart-cache";
import { rcaRepository } from "@/lib/rca-repository";

export const preferredRegion = "sin1";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  let workflowChanged = false;
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    if (!canSubmitRca(user.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const input = rcaSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({ where: { id: params.id }, include: { rca: true } });
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (isIncidentReadOnly(incident)) return Response.json({ error: "INCIDENT_READ_ONLY" }, { status: 409 });
    if (!canManageIncident(user.role) && !canUnitManageIncident(user, incident)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"].includes(incident.status)) return Response.json({ error: "RCA_NOT_ALLOWED_FOR_STATUS" }, { status: 409 });
    if (["Submitted", "Approved"].includes(incident.rca?.status ?? "")) return Response.json({ error: "RCA_LOCKED_REQUEST_REVISION" }, { status: 409 });

    const submittedAt = input.submit ? new Date() : incident.rca?.submittedAt ?? null;
    const status = input.submit ? "Submitted" : incident.rca?.status ?? "Draft";
    const rcaEncrypted = encryptedRcaNarrative(input);
    const [rca] = await prisma.$transaction([prisma.rCA.upsert({
      where: { incidentId: params.id },
      update: {
        problemStatement: null,
        timeline: null,
        contributingHuman: null,
        contributingProcess: null,
        contributingEquipment: null,
        contributingEnvironment: null,
        contributingCommunication: null,
        contributingIT: null,
        rootCause: null,
        rcaEncrypted,
        preventiveAction: null,
        kpi: input.kpi?.trim() || null,
        kpiOwnerId: input.kpiOwnerId || null,
        needRmSupport: input.needRmSupport,
        status,
        submittedAt,
      } as any,
      create: {
        incidentId: params.id,
        problemStatement: null,
        timeline: null,
        contributingHuman: null,
        contributingProcess: null,
        contributingEquipment: null,
        contributingEnvironment: null,
        contributingCommunication: null,
        contributingIT: null,
        rootCause: null,
        rcaEncrypted,
        preventiveAction: null,
        kpi: input.kpi?.trim() || null,
        kpiOwnerId: input.kpiOwnerId || null,
        needRmSupport: input.needRmSupport,
        status,
        submittedAt,
      } as any,
    }), ...(input.submit ? [prisma.incident.update({ where: { id: params.id }, data: { status: "RCASubmitted" } })] : [])]);
    workflowChanged = true;
    await auditLog({ userId: user.id, role: user.role, action: input.submit ? "submit rca" : "save rca", entityType: "RCA", entityId: rca.id, newValue: { incidentId: params.id, status } });
    if (input.submit) {
      await notifyRmTeam({ type: "rca-submitted", title: "RCA submitted", message: `${incident.incidentNo} is ready for RM approval`, relatedIncidentId: params.id });
    }
    return Response.json(await rcaRepository.getForUser(params.id, user));
  } catch (error) {
    return apiError(error);
  } finally {
    if (workflowChanged) await invalidateSmartCache();
  }
}
