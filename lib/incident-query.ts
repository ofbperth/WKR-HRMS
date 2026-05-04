import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export type IncidentFilterParams = {
  from?: string;
  to?: string;
  unitId?: string;
  severity?: string;
  simpleCategory?: string;
  riskCodeId?: string;
  status?: string;
  sentinel?: string;
  needRmSupport?: string;
  q?: string;
};

export const incidentInclude = {
  incidentUnit: true,
  reporterUnit: true,
  riskCode: true,
  reportedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } },
} satisfies Prisma.IncidentInclude;

export function scopeWhereForUser(user: { id: string; role: Role; unitId: string | null }) {
  if (user.role === "Reporter") return { reportedById: user.id } satisfies Prisma.IncidentWhereInput;
  if (user.role === "UnitManager") return { incidentUnitId: user.unitId ?? "__NO_UNIT__" } satisfies Prisma.IncidentWhereInput;
  if (user.role === "Executive") return {} satisfies Prisma.IncidentWhereInput;
  return {} satisfies Prisma.IncidentWhereInput;
}

export function buildIncidentWhere(user: { id: string; role: Role; unitId: string | null }, params: IncidentFilterParams) {
  const where: Prisma.IncidentWhereInput = { AND: [scopeWhereForUser(user)] };
  const and = where.AND as Prisma.IncidentWhereInput[];

  if (params.from || params.to) {
    const occurredAt: Prisma.DateTimeFilter = {};
    if (params.from) occurredAt.gte = new Date(`${params.from}T00:00:00`);
    if (params.to) occurredAt.lte = new Date(`${params.to}T23:59:59`);
    and.push({ occurredAt });
  }
  if (params.unitId) and.push({ incidentUnitId: params.unitId });
  if (params.severity) and.push({ severity: params.severity });
  if (params.simpleCategory) and.push({ simpleCategory: params.simpleCategory });
  if (params.riskCodeId) and.push({ riskCodeId: params.riskCodeId });
  if (params.status) and.push({ status: params.status });
  if (params.sentinel === "true") and.push({ isSentinel: true });
  if (params.sentinel === "false") and.push({ isSentinel: false });
  if (params.needRmSupport === "true") and.push({ needRmSupport: true });
  if (params.needRmSupport === "false") and.push({ needRmSupport: false });
  if (params.q) {
    const q = params.q.trim();
    and.push({
      OR: [
        { incidentNo: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
        { riskCode: { code: { contains: q } } },
        { riskCode: { nameTh: { contains: q } } },
      ],
    });
  }
  return where;
}

export async function getIncidentList(user: { id: string; role: Role; unitId: string | null }, params: IncidentFilterParams) {
  return prisma.incident.findMany({
    where: buildIncidentWhere(user, params),
    include: incidentInclude,
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
}

export async function getIncidentForUser(id: string, user: { id: string; role: Role; unitId: string | null }) {
  const incident = await prisma.incident.findFirst({
    where: { id, AND: [scopeWhereForUser(user)] },
    include: {
      incidentUnit: true,
      reporterUnit: true,
      riskCode: true,
      reportedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } },
      comments: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" } },
      attachments: true,
    },
  });
  if (!incident) return null;
  const audits = await prisma.auditLog.findMany({ where: { entityType: "Incident", entityId: id }, include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 30 });
  return { ...incident, audits };
}

export async function getLookupData() {
  const [units, riskCodes, simpleCategories] = await Promise.all([
    prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.riskCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.riskCode.findMany({ where: { isActive: true }, distinct: ["simpleCategory"], select: { simpleCategory: true }, orderBy: { simpleCategory: "asc" } }),
  ]);
  return { units, riskCodes, simpleCategories: simpleCategories.map(s => s.simpleCategory) };
}
