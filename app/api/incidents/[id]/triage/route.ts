import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { severityOptionsFor } from "@/lib/severity";
import { triageClassificationSchema } from "@/lib/validators";
import { calculateRcaDueAt } from "@/lib/rca-due-date";

const rcaRequiredSeverity = ["E", "F", "G", "H", "I"];
const sentinelSeverity = ["G", "H", "I"];

function canTriage(user: { role: string; unitId: string | null }, incident: { incidentUnitId: string }) {
  if (user.role === "RMTeam" || user.role === "Admin") return true;
  return user.role === "UnitManager" && !!user.unitId && user.unitId === incident.incidentUnitId;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = triageClassificationSchema.parse(await request.json());
    const existing = await prisma.incident.findUnique({ where: { id: params.id } });
    if (!existing) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canTriage(user, existing)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    if (existing.reviewedAt) return Response.json({ error: "TRIAGE_ALREADY_SUBMITTED" }, { status: 409 });
    const riskCode = await prisma.riskCode.findUnique({ where: { id: input.riskCodeId } });
    if (!riskCode || riskCode.clinicalOrGeneral !== existing.clinicalOrGeneral) return Response.json({ error: "INVALID_RISK_CODE_FOR_INCIDENT_TYPE" }, { status: 400 });
    if (!(severityOptionsFor(existing.clinicalOrGeneral) as readonly string[]).includes(input.severity)) return Response.json({ error: "INVALID_SEVERITY_FOR_INCIDENT_TYPE" }, { status: 400 });

    const mustRca = rcaRequiredSeverity.includes(input.severity);
    const requireRca = mustRca || input.requireRca;
    const updated = await prisma.incident.update({
      where: { id: params.id },
      data: {
        severity: input.severity,
        riskCodeId: input.riskCodeId,
        simpleCategory: input.simpleCategory,
        isSentinel: sentinelSeverity.includes(input.severity) || input.isSentinel,
        needRmSupport: input.needRmSupport,
        status: requireRca ? "RCARequired" : "UnderReview",
        rcaDueAt: requireRca ? calculateRcaDueAt(input.severity, existing.reportedAt) : null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });
    await auditLog({
      userId: user.id,
      action: "SUBMIT_TRIAGE_CLASSIFICATION",
      entityType: "Incident",
      entityId: params.id,
      oldValue: { severity: existing.severity, riskCodeId: existing.riskCodeId, simpleCategory: existing.simpleCategory, status: existing.status },
      newValue: { severity: updated.severity, riskCodeId: updated.riskCodeId, simpleCategory: updated.simpleCategory, status: updated.status, requireRca, forcedRca: mustRca },
    });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
