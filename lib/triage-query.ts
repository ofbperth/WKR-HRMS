import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { INCIDENT_PAGE_SIZE, incidentListSelect } from "@/lib/incident-query";

export async function getTriageIncidentList(user: { id: string; role: Role; unitId: string | null }, params: Record<string, string | string[] | undefined>) {
  const where: any = { reviewedAt: null, status: { notIn: ["Closed", "Rejected"] } };
  if (user.role === "UnitManager") where.incidentUnitId = user.unitId ?? "__NO_UNIT__";
  if (typeof params.from === "string" || typeof params.to === "string") {
    where.occurredAt = {};
    if (typeof params.from === "string" && params.from) where.occurredAt.gte = new Date(`${params.from}T00:00:00`);
    if (typeof params.to === "string" && params.to) where.occurredAt.lte = new Date(`${params.to}T23:59:59`);
  }
  if (typeof params.unitId === "string" && params.unitId) where.incidentUnitId = params.unitId;
  if (typeof params.severity === "string" && params.severity) where.severity = params.severity;
  if (typeof params.simpleCategory === "string" && params.simpleCategory) where.simpleCategory = params.simpleCategory;
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
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const [total, rows] = await Promise.all([
    prisma.incident.count({ where }),
    prisma.incident.findMany({
      where,
      select: incidentListSelect,
      orderBy: [{ isSentinel: "desc" }, { severity: "desc" }, { reportedAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * INCIDENT_PAGE_SIZE,
      take: INCIDENT_PAGE_SIZE + 1,
    }),
  ]);
  const hasNextPage = rows.length > INCIDENT_PAGE_SIZE;
  const data = rows.slice(0, INCIDENT_PAGE_SIZE);
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
