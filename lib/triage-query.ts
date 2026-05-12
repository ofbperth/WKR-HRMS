import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";

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
  return prisma.incident.findMany({
    where,
    include: {
      incidentUnit: true,
      reporterUnit: true,
      riskCode: true,
      reportedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } },
    },
    orderBy: [{ isSentinel: "desc" }, { severity: "desc" }, { reportedAt: "asc" }],
    take: 300,
  });
}
