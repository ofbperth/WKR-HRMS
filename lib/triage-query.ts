import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { INCIDENT_PAGE_SIZE, incidentListSelect } from "@/lib/incident-query";
import { bangkokDateRangeFilter } from "@/lib/reporting-date";

const highSeverityTriageFilter = {
  OR: [
    { clinicalOrGeneral: "Clinical", severity: { in: ["E", "F", "G", "H", "I"] } },
    { clinicalOrGeneral: "General", severity: { in: ["4", "5"] } },
  ],
};

export function buildTriageIncidentWhere(user: { id: string; role: Role; unitId: string | null }, params: Record<string, string | string[] | undefined>) {
  const where: any = { reviewedAt: null, status: { notIn: ["Closed", "Rejected"] } };
  if (user.role === "UnitManager") where.incidentUnitId = user.unitId ?? "__NO_UNIT__";
  if (typeof params.from === "string" || typeof params.to === "string") {
    const occurredAt = bangkokDateRangeFilter(
      typeof params.from === "string" ? params.from : undefined,
      typeof params.to === "string" ? params.to : undefined,
    );
    if (occurredAt) where.occurredAt = occurredAt;
  }
  if (typeof params.unitId === "string" && params.unitId) where.incidentUnitId = params.unitId;
  const teamIds = Array.isArray(params.teamId)
    ? params.teamId.filter(Boolean)
    : typeof params.teamId === "string" && params.teamId
      ? [params.teamId]
      : [];
  if (teamIds.length === 1) where.incidentTeams = { some: { teamId: teamIds[0] } };
  if (teamIds.length > 1) where.incidentTeams = { some: { teamId: { in: teamIds } } };
  if (typeof params.severity === "string" && params.severity) where.severity = params.severity;
  if (typeof params.simpleCategory === "string" && params.simpleCategory) where.simpleCategory = params.simpleCategory;
  if (Array.isArray(params.simpleCategory) && params.simpleCategory.length) where.simpleCategory = { in: params.simpleCategory.filter(Boolean) };
  if (typeof params.riskCodeId === "string" && params.riskCodeId) where.riskCodeId = params.riskCodeId;
  if (typeof params.sentinel === "string" && params.sentinel) where.isSentinel = params.sentinel === "true";
  if (typeof params.needRmSupport === "string" && params.needRmSupport) where.needRmSupport = params.needRmSupport === "true";
  if (typeof params.q === "string" && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [
      { incidentNo: { contains: q } },
      { title: { contains: q } },
      { description: { contains: q } },
      { riskCode: { code: { contains: q } } },
      { riskCode: { nameTh: { contains: q } } },
    ];
  }
  return where;
}

export async function getTriageIncidentList(user: { id: string; role: Role; unitId: string | null }, params: Record<string, string | string[] | undefined>): Promise<{ data: any[]; meta: { page: number; pageSize: number; total: number; totalPages: number; hasNextPage: boolean; nextCursor: string | null } }> {
  const where = buildTriageIncidentWhere(user, params);
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const highWhere = { AND: [where, highSeverityTriageFilter] };
  const normalWhere = { AND: [where, { NOT: highSeverityTriageFilter }] };
  const orderBy = [{ isSentinel: "desc" as const }, { severity: "desc" as const }, { reportedAt: "asc" as const }, { id: "asc" as const }];
  const offset = (page - 1) * INCIDENT_PAGE_SIZE;
  const [highTotal, normalTotal] = await Promise.all([
    prisma.incident.count({ where: highWhere }),
    prisma.incident.count({ where: normalWhere }),
  ]);
  const highTake = Math.max(0, Math.min(INCIDENT_PAGE_SIZE + 1, highTotal - offset));
  const highRows = highTake > 0 ? await prisma.incident.findMany({
    where: highWhere,
    select: incidentListSelect as any,
    orderBy,
    skip: offset,
    take: highTake,
  }) : [];
  const normalTake = INCIDENT_PAGE_SIZE + 1 - highRows.length;
  const normalSkip = Math.max(0, offset - highTotal);
  const normalRows = normalTake > 0 ? await prisma.incident.findMany({
    where: normalWhere,
    select: incidentListSelect as any,
    orderBy,
    skip: normalSkip,
    take: normalTake,
  }) : [];
  const rows: any[] = [...(highRows as any[]), ...(normalRows as any[])];
  const total = highTotal + normalTotal;
  const hasNextPage = rows.length > INCIDENT_PAGE_SIZE;
  const data: any[] = rows.slice(0, INCIDENT_PAGE_SIZE);
  return {
    data,
    meta: {
      page,
      pageSize: INCIDENT_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / INCIDENT_PAGE_SIZE)),
      hasNextPage,
      nextCursor: hasNextPage ? data[data.length - 1]?.id ?? null : null,
    },
  };
}
