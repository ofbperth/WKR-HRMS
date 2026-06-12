import { Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { activeIncidentFilter } from "@/lib/prisma-fields";
import {
  canCreateHospitalRisk,
  canCreateUnitRiskProposal,
  canManageAllRisks,
} from "@/lib/rbac";
import type {
  DbRiskRegister,
  RiskControlEffectiveness,
  RiskReviewFrequency,
  RiskScope,
  RiskStatus,
  RiskTrend,
  RiskType,
  Role,
} from "@/lib/types";

export type RiskAccessUser = {
  id: string;
  role: Role;
  unitId: string | null;
  name?: string | null;
  email?: string | null;
};

export type RiskFilterParams = {
  scope?: string;
  status?: string;
  ownerUnitId?: string;
  ownerTeamId?: string;
  q?: string;
  riskType?: string;
  trend?: string;
  decisionRequired?: string;
  dueReview?: string;
};

export const riskScopeLabels: Record<string, string> = {
  UNIT: "Unit",
  HOSPITAL: "Hospital",
};

export const riskStatusLabels: Record<string, string> = {
  PROPOSED: "Proposed",
  ACTIVE: "Active",
  MONITORING: "Monitoring",
  ACCEPTED: "Accepted",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const riskTypeLabels: Record<string, string> = {
  CLINICAL: "Clinical",
  OPERATIONAL: "Operational",
  STRATEGIC: "Strategic",
  COMPLIANCE: "Compliance",
  FINANCIAL: "Financial",
  IT: "IT",
};

export const riskTrendLabels: Record<string, string> = {
  WORSE: "Worse",
  STABLE: "Stable",
  BETTER: "Better",
  UNKNOWN: "Unknown",
};

export const riskControlEffectivenessLabels: Record<string, string> = {
  GOOD: "Good",
  PARTIAL: "Partial",
  WEAK: "Weak",
  NOT_TESTED: "Not tested",
};

export const riskReviewFrequencyLabels: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMIANNUAL: "Semiannual",
  ANNUAL: "Annual",
};

export type RiskSummary = DbRiskRegister & {
  ownerUnit?: { id: string; name: string } | null;
  ownerTeam?: { id: string; name: string; code: string | null } | null;
  executiveSponsor?: { id: string; name: string; role: string } | null;
  createdBy?: { id: string; name: string; role: string } | null;
  approvedBy?: { id: string; name: string; role: string } | null;
  closedBy?: { id: string; name: string; role: string } | null;
  incidentLinks?: any[];
  reviews?: any[];
  aggregate: ReturnType<typeof aggregateRiskIncidents>;
  inherentScore: number;
  residualScore: number;
  inherentLevel: string;
  residualLevel: string;
  canEdit: boolean;
  canLink: boolean;
  canReview: boolean;
  detailHref: string | null;
  aggregateOnly: boolean;
};

type SelectedRisk = any;

function activeIncidentAnd() {
  const activeFilter = activeIncidentFilter();
  return activeFilter ? [activeFilter] : [];
}

function riskListBaseInclude(includeSensitiveNarrative: boolean) {
  return {
    ownerUnit: { select: { id: true, name: true } },
    ownerTeam: { select: { id: true, name: true, code: true } },
    executiveSponsor: { select: { id: true, name: true, role: true } },
    incidentLinks: {
      select: {
        id: true,
        linkedAt: true,
        note: true,
        incident: {
          select: {
            id: true,
            incidentNo: true,
            title: true,
            occurredAt: true,
            severity: true,
            status: true,
            isSentinel: true,
            incidentUnitId: true,
            incidentUnit: { select: { id: true, name: true } },
            simpleCategory: true,
            riskCode: { select: { id: true, code: true, nameTh: true, simpleCategory: true } },
            rca: includeSensitiveNarrative
              ? {
                  select: {
                    id: true,
                    status: true,
                    rootCause: true,
                    preventiveAction: true,
                    approvedAt: true,
                  },
                }
              : {
                  select: {
                    id: true,
                    status: true,
                    approvedAt: true,
                  },
                },
            actionPlans: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                owner: { select: { id: true, name: true, role: true } },
              },
              orderBy: [{ dueDate: "asc" as const }, { id: "asc" as const }],
            },
          },
        },
      },
      orderBy: [{ linkedAt: "desc" as const }, { id: "desc" as const }],
    },
    reviews: {
      select: {
        id: true,
        reviewDate: true,
        residualLikelihood: true,
        residualImpact: true,
        controlEffectiveness: true,
        trend: true,
        summary: true,
        nextReviewAt: true,
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ reviewDate: "desc" as const }, { createdAt: "desc" as const }],
    },
    createdBy: { select: { id: true, name: true, role: true } },
    approvedBy: { select: { id: true, name: true, role: true } },
    closedBy: { select: { id: true, name: true, role: true } },
  };
}

export function calculateRiskScore(likelihood: number, impact: number) {
  return likelihood * impact;
}

export function riskLevelFromScore(score: number) {
  if (score >= 17) return "Extreme";
  if (score >= 10) return "High";
  if (score >= 5) return "Moderate";
  return "Low";
}

export function isHighSeverityIncident(severity: string) {
  return ["E", "F", "G", "H", "I", "4", "5"].includes(severity);
}

export function hasOpenRca(incident: any) {
  return incident.status === "RCARequired" || (incident.rca && incident.rca.status !== "Approved");
}

export function openActionCountForIncident(incident: any) {
  return (incident.actionPlans ?? []).filter((action: any) => action.status !== "Verified").length;
}

export function overdueActionCountForIncident(incident: any, now = new Date()) {
  return (incident.actionPlans ?? []).filter((action: any) => action.status !== "Verified" && new Date(action.dueDate) < now).length;
}

export function aggregateRiskIncidents(incidentLinks: Array<{ incident: any }>, now = new Date()) {
  const linkedIncidentCount = incidentLinks.length;
  let highSeverityCount = 0;
  let sentinelCount = 0;
  let openRcaCount = 0;
  let rcaCount = 0;
  let openActionCount = 0;
  let overdueActionCount = 0;
  const nrlsBreakdown = new Map<string, number>();
  const simpleBreakdown = new Map<string, number>();
  const unitBreakdown = new Map<string, number>();
  let last30 = 0;
  let last90 = 0;
  const cutoff30 = new Date(now);
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff90 = new Date(now);
  cutoff90.setDate(cutoff90.getDate() - 90);

  for (const link of incidentLinks) {
    const incident = link.incident;
    if (!incident) continue;
    if (isHighSeverityIncident(incident.severity)) highSeverityCount += 1;
    if (incident.isSentinel) sentinelCount += 1;
    if (incident.rca) rcaCount += 1;
    if (hasOpenRca(incident)) openRcaCount += 1;
    openActionCount += openActionCountForIncident(incident);
    overdueActionCount += overdueActionCountForIncident(incident, now);
    const riskCodeLabel = incident.riskCode ? `${incident.riskCode.code}` : "Unknown";
    nrlsBreakdown.set(riskCodeLabel, (nrlsBreakdown.get(riskCodeLabel) ?? 0) + 1);
    const simple = incident.simpleCategory || incident.riskCode?.simpleCategory || "Unknown";
    simpleBreakdown.set(simple, (simpleBreakdown.get(simple) ?? 0) + 1);
    const unit = incident.incidentUnit?.name || "Unknown";
    unitBreakdown.set(unit, (unitBreakdown.get(unit) ?? 0) + 1);
    const occurredAt = new Date(incident.occurredAt);
    if (occurredAt >= cutoff30) last30 += 1;
    if (occurredAt >= cutoff90) last90 += 1;
  }

  return {
    linkedIncidentCount,
    highSeverityCount,
    sentinelCount,
    rcaCount,
    openRcaCount,
    openActionCount,
    overdueActionCount,
    nrlsBreakdown: Array.from(nrlsBreakdown.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    simpleBreakdown: Array.from(simpleBreakdown.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    unitBreakdown: Array.from(unitBreakdown.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    trend30d: last30,
    trend90d: last90,
  };
}

export function riskScopeWhereForUser(user: RiskAccessUser) {
  if (user.role === "Executive") {
    return { scope: "HOSPITAL" };
  }
  if (user.role === "UnitManager") {
    return {
      OR: [
        { scope: "HOSPITAL" },
        { scope: "UNIT", ownerUnitId: user.unitId ?? "__NO_UNIT__" },
      ],
    };
  }
  return {};
}

export function buildRiskWhereForUser(user: RiskAccessUser, filters: RiskFilterParams = {}) {
  const and: Record<string, unknown>[] = [riskScopeWhereForUser(user)];
  if (filters.scope) and.push({ scope: filters.scope });
  if (filters.status) and.push({ status: filters.status });
  if (filters.ownerUnitId) and.push({ ownerUnitId: filters.ownerUnitId });
  if (filters.ownerTeamId) and.push({ ownerTeamId: filters.ownerTeamId });
  if (filters.riskType) and.push({ riskType: filters.riskType });
  if (filters.trend) and.push({ trend: filters.trend });
  if (filters.decisionRequired === "true") and.push({ decisionRequired: true });
  if (filters.decisionRequired === "false") and.push({ decisionRequired: false });
  if (filters.dueReview === "overdue") and.push({ nextReviewAt: { lt: new Date() } });
  if (filters.dueReview === "30d") {
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    and.push({ nextReviewAt: { lte: next30Days } });
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { riskNo: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { riskDomain: { contains: q, mode: "insensitive" } },
      ],
    } as any);
  }
  return { AND: and };
}

export function canUserViewRisk(user: RiskAccessUser, risk: Pick<DbRiskRegister, "scope" | "ownerUnitId">) {
  if (user.role === "Executive") return risk.scope === "HOSPITAL";
  if (user.role === "UnitManager") {
    return risk.scope === "HOSPITAL" || risk.ownerUnitId === user.unitId;
  }
  return user.role === "RMTeam" || user.role === "Admin";
}

export function isAggregateOnlyRiskView(user: RiskAccessUser, risk: Pick<DbRiskRegister, "scope" | "ownerUnitId">) {
  if (user.role === "Executive") return true;
  if (user.role === "UnitManager" && risk.scope === "HOSPITAL") return true;
  return false;
}

export function canUserEditRisk(user: RiskAccessUser, risk: Pick<DbRiskRegister, "scope" | "status" | "ownerUnitId">) {
  if (canManageAllRisks(user.role)) return true;
  return user.role === "UnitManager" && risk.scope === "UNIT" && risk.status === "PROPOSED" && risk.ownerUnitId === user.unitId;
}

export function canUserReviewRisk(user: RiskAccessUser, risk: Pick<DbRiskRegister, "scope" | "ownerUnitId">) {
  if (canManageAllRisks(user.role)) return true;
  return user.role === "UnitManager" && risk.scope === "UNIT" && risk.ownerUnitId === user.unitId;
}

export function canUserLinkRiskIncident(
  user: RiskAccessUser,
  risk: Pick<DbRiskRegister, "scope" | "status" | "ownerUnitId">,
  incident: Pick<any, "incidentUnitId">,
) {
  if (canManageAllRisks(user.role)) return true;
  return (
    user.role === "UnitManager" &&
    risk.scope === "UNIT" &&
    ["PROPOSED", "ACTIVE"].includes(risk.status) &&
    risk.ownerUnitId === user.unitId &&
    incident.incidentUnitId === user.unitId
  );
}

function normalizeDateInput(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function generateRiskNo(client: any) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const prefix = `RISK-${year}-`;
    const latest = await client.riskRegister.findFirst({
      where: { riskNo: { startsWith: prefix } },
      orderBy: { riskNo: "desc" },
      select: { riskNo: true },
    });
    const latestSequence = latest?.riskNo ? Number(latest.riskNo.slice(prefix.length)) || 0 : 0;
    const nextSequence = String(latestSequence + 1).padStart(4, "0");
    return `${prefix}${nextSequence}`;
  }
  throw new Error("RISK_NO_GENERATION_FAILED");
}

function normalizeRiskPayload(input: Record<string, unknown>): Record<string, unknown> {
  return {
    ...input,
    riskDomain: typeof input.riskDomain === "string" && input.riskDomain.trim() === "" ? null : input.riskDomain,
    ownerUnitId: typeof input.ownerUnitId === "string" && input.ownerUnitId.trim() === "" ? null : input.ownerUnitId,
    ownerTeamId: typeof input.ownerTeamId === "string" && input.ownerTeamId.trim() === "" ? null : input.ownerTeamId,
    executiveSponsorId: typeof input.executiveSponsorId === "string" && input.executiveSponsorId.trim() === "" ? null : input.executiveSponsorId,
    nextReviewAt: typeof input.nextReviewAt === "string" && input.nextReviewAt.trim() === "" ? null : input.nextReviewAt,
    decisionNote: typeof input.decisionNote === "string" && input.decisionNote.trim() === "" ? null : input.decisionNote,
    acceptedReason: typeof input.acceptedReason === "string" && input.acceptedReason.trim() === "" ? null : input.acceptedReason,
  };
}

function serializeRiskSummary(user: RiskAccessUser, risk: SelectedRisk): RiskSummary {
  const aggregateOnly = isAggregateOnlyRiskView(user, risk);
  const aggregate = aggregateRiskIncidents(risk.incidentLinks ?? []);
  const inherentScore = calculateRiskScore(risk.inherentLikelihood, risk.inherentImpact);
  const residualScore = calculateRiskScore(risk.residualLikelihood, risk.residualImpact);
  return {
    ...risk,
    aggregate,
    inherentScore,
    residualScore,
    inherentLevel: riskLevelFromScore(inherentScore),
    residualLevel: riskLevelFromScore(residualScore),
    canEdit: canUserEditRisk(user, risk),
    canLink: !aggregateOnly && canUserReviewRisk(user, risk),
    canReview: !aggregateOnly && canUserReviewRisk(user, risk),
    detailHref:
      user.role === "Executive"
        ? null
        : user.role === "UnitManager"
          ? `/unit/risks/${risk.id}`
          : `/rm/risks/${risk.id}`,
    aggregateOnly,
  };
}

function redactRiskDetailForAggregateView(risk: SelectedRisk) {
  return {
    ...risk,
    description: risk.description,
    incidentLinks: [],
    reviews: (risk.reviews ?? []).map((review: any) => ({
      ...review,
      summary: undefined,
    })),
  };
}

export async function getRiskListForUser(user: RiskAccessUser, filters: RiskFilterParams = {}) {
  const where = buildRiskWhereForUser(user, filters);
  const rows = await prisma.riskRegister.findMany({
    where: where as any,
    include: riskListBaseInclude(false) as any,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
  const data = rows.map((risk) => serializeRiskSummary(user, risk as any));
  return {
    data,
    cards: {
      extreme: data.filter((risk) => risk.residualLevel === "Extreme" && risk.status !== "CLOSED" && risk.status !== "REJECTED").length,
      high: data.filter((risk) => ["High", "Extreme"].includes(risk.residualLevel) && risk.status !== "CLOSED" && risk.status !== "REJECTED").length,
      overdueReview: data.filter((risk) => risk.nextReviewAt && new Date(risk.nextReviewAt) < new Date() && !["CLOSED", "REJECTED"].includes(risk.status)).length,
      needDecision: data.filter((risk) => risk.decisionRequired).length,
    },
  };
}

export async function getRiskDetailForUser(id: string, user: RiskAccessUser) {
  const risk = await prisma.riskRegister.findUnique({
    where: { id },
    include: riskListBaseInclude(!isAggregateOnlyRiskView(user, { scope: "UNIT", ownerUnitId: user.unitId })) as any,
  });
  if (!risk || !canUserViewRisk(user, risk as any)) return null;
  const aggregateOnly = isAggregateOnlyRiskView(user, risk as any);
  const shaped = aggregateOnly ? redactRiskDetailForAggregateView(risk as any) : risk;
  return serializeRiskSummary(user, shaped as any);
}

export async function createRiskForUser(user: RiskAccessUser, rawInput: Record<string, unknown>) {
  if (!canCreateUnitRiskProposal(user.role) && !canCreateHospitalRisk(user.role)) {
    throw new Error("FORBIDDEN");
  }
  const input = normalizeRiskPayload(rawInput);
  const scope = (input.scope as RiskScope | undefined) ?? (user.role === "UnitManager" ? "UNIT" : "HOSPITAL");
  const status = (input.status as RiskStatus | undefined) ?? (user.role === "UnitManager" ? "PROPOSED" : "ACTIVE");
  if (user.role === "UnitManager") {
    if (scope !== "UNIT" || status !== "PROPOSED") throw new Error("FORBIDDEN");
    if (!user.unitId) throw new Error("UNIT_REQUIRED");
  }
  if (scope === "HOSPITAL" && !canCreateHospitalRisk(user.role)) throw new Error("FORBIDDEN");
  const ownerUnitId = scope === "UNIT" ? (user.role === "UnitManager" ? user.unitId : (input.ownerUnitId as string | null) ?? null) : ((input.ownerUnitId as string | null) ?? null);
  const approvedAt = status !== "PROPOSED" && status !== "REJECTED" ? new Date() : null;
  const approvedById = approvedAt ? user.id : null;

  const created = await prisma.$transaction(async (tx) => {
    const riskNo = await generateRiskNo(tx);
    return tx.riskRegister.create({
      data: {
        riskNo,
        title: String(input.title),
        description: String(input.description),
        scope,
        status,
        riskType: String(input.riskType),
        riskDomain: (input.riskDomain as string | null) ?? null,
        ownerUnitId,
        ownerTeamId: (input.ownerTeamId as string | null) ?? null,
        executiveSponsorId: (input.executiveSponsorId as string | null) ?? null,
        createdById: user.id,
        approvedById,
        approvedAt,
        inherentLikelihood: Number(input.inherentLikelihood),
        inherentImpact: Number(input.inherentImpact),
        residualLikelihood: Number(input.residualLikelihood),
        residualImpact: Number(input.residualImpact),
        controlEffectiveness: String(input.controlEffectiveness),
        trend: String(input.trend),
        reviewFrequency: String(input.reviewFrequency),
        nextReviewAt: normalizeDateInput((input.nextReviewAt as string | null) ?? null),
        decisionRequired: Boolean(input.decisionRequired),
        decisionNote: (input.decisionNote as string | null) ?? null,
        acceptedReason: (input.acceptedReason as string | null) ?? null,
      },
    });
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "CREATE_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: created.id,
    newValue: created,
  });
  return created;
}

export async function updateRiskForUser(user: RiskAccessUser, riskId: string, rawInput: Record<string, unknown>) {
  const existing = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!existing) return null;
  if (!canUserEditRisk(user, existing as any)) throw new Error("FORBIDDEN");
  const input = normalizeRiskPayload(rawInput);
  if (user.role === "UnitManager") {
    if (input.scope && input.scope !== "UNIT") throw new Error("FORBIDDEN");
    if (input.status && input.status !== "PROPOSED") throw new Error("FORBIDDEN");
    if (input.ownerUnitId && input.ownerUnitId !== user.unitId) throw new Error("FORBIDDEN");
  }

  const updated = await prisma.riskRegister.update({
    where: { id: riskId },
    data: {
      ...(input.title !== undefined ? { title: String(input.title) } : {}),
      ...(input.description !== undefined ? { description: String(input.description) } : {}),
      ...(input.scope !== undefined ? { scope: String(input.scope) } : {}),
      ...(input.status !== undefined ? { status: String(input.status) } : {}),
      ...(input.riskType !== undefined ? { riskType: String(input.riskType) } : {}),
      ...(input.riskDomain !== undefined ? { riskDomain: (input.riskDomain as string | null) ?? null } : {}),
      ...(input.ownerUnitId !== undefined ? { ownerUnitId: (input.ownerUnitId as string | null) ?? null } : {}),
      ...(input.ownerTeamId !== undefined ? { ownerTeamId: (input.ownerTeamId as string | null) ?? null } : {}),
      ...(input.executiveSponsorId !== undefined ? { executiveSponsorId: (input.executiveSponsorId as string | null) ?? null } : {}),
      ...(input.inherentLikelihood !== undefined ? { inherentLikelihood: Number(input.inherentLikelihood) } : {}),
      ...(input.inherentImpact !== undefined ? { inherentImpact: Number(input.inherentImpact) } : {}),
      ...(input.residualLikelihood !== undefined ? { residualLikelihood: Number(input.residualLikelihood) } : {}),
      ...(input.residualImpact !== undefined ? { residualImpact: Number(input.residualImpact) } : {}),
      ...(input.controlEffectiveness !== undefined ? { controlEffectiveness: String(input.controlEffectiveness) } : {}),
      ...(input.trend !== undefined ? { trend: String(input.trend) } : {}),
      ...(input.reviewFrequency !== undefined ? { reviewFrequency: String(input.reviewFrequency) } : {}),
      ...(input.nextReviewAt !== undefined ? { nextReviewAt: normalizeDateInput((input.nextReviewAt as string | null) ?? null) } : {}),
      ...(input.decisionRequired !== undefined ? { decisionRequired: Boolean(input.decisionRequired) } : {}),
      ...(input.decisionNote !== undefined ? { decisionNote: (input.decisionNote as string | null) ?? null } : {}),
      ...(input.acceptedReason !== undefined ? { acceptedReason: (input.acceptedReason as string | null) ?? null } : {}),
    },
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "UPDATE_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: riskId,
    oldValue: existing,
    newValue: updated,
  });
  return updated;
}

export async function approveRiskForUser(user: RiskAccessUser, riskId: string, note?: string | null) {
  if (!canManageAllRisks(user.role)) throw new Error("FORBIDDEN");
  const existing = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!existing) return null;
  const updated = await prisma.riskRegister.update({
    where: { id: riskId },
    data: {
      status: "ACTIVE",
      approvedById: user.id,
      approvedAt: new Date(),
      decisionNote: note ?? existing.decisionNote,
    },
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "APPROVE_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: riskId,
    oldValue: existing,
    newValue: updated,
  });
  return updated;
}

export async function rejectRiskForUser(user: RiskAccessUser, riskId: string, note?: string | null) {
  if (!canManageAllRisks(user.role)) throw new Error("FORBIDDEN");
  const existing = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!existing) return null;
  const updated = await prisma.riskRegister.update({
    where: { id: riskId },
    data: {
      status: "REJECTED",
      decisionNote: note ?? existing.decisionNote,
    },
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "REJECT_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: riskId,
    oldValue: existing,
    newValue: updated,
  });
  return updated;
}

export async function mergeRiskProposalForUser(user: RiskAccessUser, sourceRiskId: string, targetRiskId: string, note?: string | null) {
  if (!canManageAllRisks(user.role)) throw new Error("FORBIDDEN");
  if (sourceRiskId === targetRiskId) throw new Error("VALIDATION_ERROR");
  const [source, target] = await Promise.all([
    prisma.riskRegister.findUnique({ where: { id: sourceRiskId }, include: { incidentLinks: true } }),
    prisma.riskRegister.findUnique({ where: { id: targetRiskId } }),
  ]);
  if (!source || !target) return null;
  const updated = await prisma.$transaction(async (tx) => {
    if (source.incidentLinks.length > 0) {
      await tx.riskIncidentLink.createMany({
        data: source.incidentLinks.map((link) => ({
          riskId: target.id,
          incidentId: link.incidentId,
          linkedById: user.id,
          linkedAt: new Date(),
          note: link.note,
        })),
        skipDuplicates: true,
      });
      await tx.riskIncidentLink.deleteMany({ where: { riskId: source.id } });
    }
    return tx.riskRegister.update({
      where: { id: source.id },
      data: {
        status: "REJECTED",
        decisionNote: note?.trim() ? `${note.trim()} | merged into ${target.riskNo}` : `merged into ${target.riskNo}`,
      },
    });
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "MERGE_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: source.id,
    oldValue: source,
    newValue: { sourceRiskId, targetRiskId: target.id, targetRiskNo: target.riskNo },
  });
  return updated;
}

async function getScopedIncidentForLink(incidentId: string) {
  return prisma.incident.findFirst({
    where: {
      id: incidentId,
      AND: [{ status: { not: "Rejected" } }, ...activeIncidentAnd()],
    } as any,
    select: { id: true, incidentNo: true, incidentUnitId: true, title: true },
  });
}

export async function linkIncidentsToRiskForUser(user: RiskAccessUser, riskId: string, incidentIds: string[], note?: string | null) {
  const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!risk || !canUserViewRisk(user, risk as any)) return null;
  const incidents = (await Promise.all(incidentIds.map((incidentId) => getScopedIncidentForLink(incidentId)))).filter(Boolean) as any[];
  if (incidents.length !== incidentIds.length) throw new Error("NOT_FOUND");
  for (const incident of incidents) {
    if (!canUserLinkRiskIncident(user, risk as any, incident)) throw new Error("FORBIDDEN");
  }
  const existingLinks = await prisma.riskIncidentLink.findMany({
    where: { riskId, incidentId: { in: incidentIds } },
    select: { incidentId: true },
  });
  const existingIncidentIds = new Set(existingLinks.map((item) => item.incidentId));
  const newIncidentIds = incidentIds.filter((incidentId) => !existingIncidentIds.has(incidentId));
  if (newIncidentIds.length === 0) {
    return { risk, linkedCount: 0, duplicateIncidentIds: incidentIds };
  }
  await prisma.riskIncidentLink.createMany({
    data: newIncidentIds.map((incidentId) => ({
      riskId,
      incidentId,
      linkedById: user.id,
      linkedAt: new Date(),
      note: note ?? null,
    })),
    skipDuplicates: true,
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "LINK_RISK_INCIDENT",
    entityType: "RiskRegister",
    entityId: riskId,
    newValue: { incidentIds: newIncidentIds, duplicateIncidentIds: incidentIds.filter((id) => existingIncidentIds.has(id)), note: note ?? null },
  });
  return {
    risk,
    linkedCount: newIncidentIds.length,
    duplicateIncidentIds: incidentIds.filter((id) => existingIncidentIds.has(id)),
  };
}

export async function unlinkIncidentFromRiskForUser(user: RiskAccessUser, riskId: string, incidentId: string) {
  const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  const incident = await getScopedIncidentForLink(incidentId);
  if (!risk || !incident) return null;
  if (!canUserLinkRiskIncident(user, risk as any, incident)) throw new Error("FORBIDDEN");
  await prisma.riskIncidentLink.deleteMany({ where: { riskId, incidentId } });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "UNLINK_RISK_INCIDENT",
    entityType: "RiskRegister",
    entityId: riskId,
    newValue: { incidentId },
  });
  return { ok: true };
}

export async function addRiskReviewForUser(user: RiskAccessUser, riskId: string, input: {
  reviewDate: string;
  residualLikelihood: number;
  residualImpact: number;
  controlEffectiveness: RiskControlEffectiveness | string;
  trend: RiskTrend | string;
  summary: string;
  nextReviewAt?: string | null;
}) {
  const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!risk) return null;
  if (!canUserReviewRisk(user, risk as any)) throw new Error("FORBIDDEN");
  const reviewDate = normalizeDateInput(input.reviewDate);
  if (!reviewDate) throw new Error("VALIDATION_ERROR");
  const nextReviewAt = normalizeDateInput(input.nextReviewAt ?? null);
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.riskReview.create({
      data: {
        riskId,
        reviewedById: user.id,
        reviewDate,
        residualLikelihood: input.residualLikelihood,
        residualImpact: input.residualImpact,
        controlEffectiveness: String(input.controlEffectiveness),
        trend: String(input.trend),
        summary: input.summary,
        nextReviewAt,
      },
    });
    const riskUpdate = await tx.riskRegister.update({
      where: { id: riskId },
      data: {
        residualLikelihood: input.residualLikelihood,
        residualImpact: input.residualImpact,
        controlEffectiveness: String(input.controlEffectiveness),
        trend: String(input.trend),
        nextReviewAt,
      },
    });
    return { review, riskUpdate };
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "ADD_RISK_REVIEW",
    entityType: "RiskRegister",
    entityId: riskId,
    newValue: result,
  });
  return result;
}

export async function closeRiskForUser(user: RiskAccessUser, riskId: string, note?: string | null) {
  if (!canManageAllRisks(user.role)) throw new Error("FORBIDDEN");
  const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!risk) return null;
  const updated = await prisma.riskRegister.update({
    where: { id: riskId },
    data: {
      status: "CLOSED",
      closedById: user.id,
      closedAt: new Date(),
      decisionNote: note ?? risk.decisionNote,
    },
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "CLOSE_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: riskId,
    oldValue: risk,
    newValue: updated,
  });
  return updated;
}

export async function acceptRiskForUser(user: RiskAccessUser, riskId: string, acceptedReason: string, note?: string | null) {
  if (!canManageAllRisks(user.role)) throw new Error("FORBIDDEN");
  const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
  if (!risk) return null;
  const updated = await prisma.riskRegister.update({
    where: { id: riskId },
    data: {
      status: "ACCEPTED",
      acceptedReason,
      decisionNote: note ?? risk.decisionNote,
    },
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "ACCEPT_RISK_REGISTER",
    entityType: "RiskRegister",
    entityId: riskId,
    oldValue: risk,
    newValue: updated,
  });
  return updated;
}

export async function getRelatedRisksForIncident(incidentId: string, user: RiskAccessUser) {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      AND: [{ status: { not: "Rejected" } }, ...activeIncidentAnd()],
    } as any,
    select: { id: true, incidentUnitId: true },
  });
  if (!incident) return [];
  const links = await prisma.riskIncidentLink.findMany({
    where: {
      incidentId,
      risk: buildRiskWhereForUser(user, {}) as any,
    },
    include: {
      risk: {
        include: {
          ownerUnit: { select: { id: true, name: true } },
          ownerTeam: { select: { id: true, name: true, code: true } },
          incidentLinks: { select: { incidentId: true } },
        },
      },
    },
    orderBy: [{ linkedAt: "desc" }, { id: "desc" }],
  });
  return links
    .map((link) => {
      const risk = link.risk as any;
      const aggregateOnly = isAggregateOnlyRiskView(user, risk);
      return {
        id: risk.id,
        riskNo: risk.riskNo,
        title: risk.title,
        scope: risk.scope,
        status: risk.status,
        ownerUnit: risk.ownerUnit,
        residualScore: calculateRiskScore(risk.residualLikelihood, risk.residualImpact),
        residualLevel: riskLevelFromScore(calculateRiskScore(risk.residualLikelihood, risk.residualImpact)),
        linkedIncidentCount: risk.incidentLinks.length,
        detailHref: aggregateOnly ? null : user.role === "UnitManager" ? `/unit/risks/${risk.id}` : `/rm/risks/${risk.id}`,
      };
    })
    .filter(Boolean);
}

export async function getRiskSuggestionsForRm() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const incidents = await prisma.incident.findMany({
    where: {
      occurredAt: { gte: cutoff },
      status: { not: "Rejected" },
      AND: activeIncidentAnd(),
    } as any,
    select: {
      id: true,
      incidentNo: true,
      title: true,
      occurredAt: true,
      severity: true,
      isSentinel: true,
      simpleCategory: true,
      incidentUnitId: true,
      incidentUnit: { select: { id: true, name: true } },
      riskCodeId: true,
      riskCode: { select: { id: true, code: true, nameTh: true, simpleCategory: true } },
      incidentTeams: { select: { teamId: true, team: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: 500,
  });
  const map = new Map<string, any>();
  for (const incident of incidents) {
    const teamKeys = incident.incidentTeams.length ? incident.incidentTeams.map((item) => item.teamId) : ["no-team"];
    for (const teamKey of teamKeys) {
      const key = `${incident.riskCodeId}::${incident.incidentUnitId}::${teamKey}`;
      const current = map.get(key) ?? {
        key,
        riskCodeId: incident.riskCodeId,
        riskCode: incident.riskCode,
        simpleCategory: incident.simpleCategory,
        unit: incident.incidentUnit,
        team: incident.incidentTeams.find((item) => item.teamId === teamKey)?.team ?? null,
        incidents: [],
      };
      current.incidents.push(incident);
      map.set(key, current);
    }
  }
  return Array.from(map.values())
    .map((cluster) => {
      const highSeverityCount = cluster.incidents.filter((incident: any) => isHighSeverityIncident(incident.severity)).length;
      const sentinelCount = cluster.incidents.filter((incident: any) => incident.isSentinel).length;
      const sameRiskCodeCount = cluster.incidents.length;
      const qualifies =
        sameRiskCodeCount >= 5 ||
        highSeverityCount >= 2 ||
        sentinelCount >= 1 ||
        sameRiskCodeCount >= 3;
      return {
        ...cluster,
        qualifies,
        incidentCount: sameRiskCodeCount,
        highSeverityCount,
        sentinelCount,
        reason:
          sentinelCount >= 1
            ? "sentinel present"
            : highSeverityCount >= 2
              ? "2 or more high severity incidents in 90 days"
              : sameRiskCodeCount >= 5
                ? "5 or more incidents in 90 days"
                : "repeat same risk code in same unit",
      };
    })
    .filter((cluster) => cluster.qualifies)
    .sort((a, b) => b.sentinelCount - a.sentinelCount || b.highSeverityCount - a.highSeverityCount || b.incidentCount - a.incidentCount)
    .slice(0, 20);
}

export async function getRiskDashboardWidget(unitId: string | null) {
  if (!unitId) {
    return { highOrExtreme: 0, dueSoon: 0, overdue: 0, openActions: 0 };
  }
  const rows = await prisma.riskRegister.findMany({
    where: {
      scope: "UNIT",
      ownerUnitId: unitId,
      status: { in: ["PROPOSED", "ACTIVE", "MONITORING", "ACCEPTED"] },
    },
    include: {
      incidentLinks: {
        select: {
          incident: {
            select: {
              actionPlans: {
                select: { status: true, dueDate: true },
              },
            },
          },
        },
      },
    },
  });
  const now = new Date();
  const next30 = new Date(now);
  next30.setDate(next30.getDate() + 30);
  return rows.reduce(
    (acc, risk: any) => {
      const residualScore = calculateRiskScore(risk.residualLikelihood, risk.residualImpact);
      const level = riskLevelFromScore(residualScore);
      if (level === "High" || level === "Extreme") acc.highOrExtreme += 1;
      if (risk.nextReviewAt && new Date(risk.nextReviewAt) <= next30) acc.dueSoon += 1;
      if (risk.nextReviewAt && new Date(risk.nextReviewAt) < now) acc.overdue += 1;
      for (const link of risk.incidentLinks ?? []) {
        acc.openActions += openActionCountForIncident(link.incident);
      }
      return acc;
    },
    { highOrExtreme: 0, dueSoon: 0, overdue: 0, openActions: 0 },
  );
}
