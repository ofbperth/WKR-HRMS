import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { activeIncidentFilter } from "@/lib/prisma-fields";
import { cache as reactCache } from "react";

type IncidentWhereInput = Record<string, unknown>;
const cache = typeof reactCache === "function" ? reactCache : <T extends (...args: any[]) => any>(fn: T) => fn;

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
  page?: string | string[];
  cursor?: string | string[];
};

export const INCIDENT_PAGE_SIZE = 25;

export const incidentInclude = {
  incidentUnit: true,
  reporterUnit: true,
  riskCode: true,
  reportedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } },
};

export const incidentListSelect = {
  id: true,
  incidentNo: true,
  occurredAt: true,
  reportedAt: true,
  title: true,
  severity: true,
  status: true,
  isSentinel: true,
  needRmSupport: true,
  clinicalOrGeneral: true,
  simpleCategory: true,
  incidentUnit: { select: { id: true, name: true, type: true, isActive: true } },
  reporterUnit: { select: { id: true, name: true, type: true, isActive: true } },
  riskCode: { select: { id: true, code: true, nameTh: true, nameEn: true, clinicalOrGeneral: true, simpleCategory: true, isActive: true } },
} as const;

export function scopeWhereForUser(user: { id: string; role: Role; unitId: string | null }) {
  if (user.role === "Reporter") return { reportedById: user.id };
  if (user.role === "UnitManager") return { incidentUnitId: user.unitId ?? "__NO_UNIT__" };
  if (user.role === "Executive") return {};
  return {};
}

export function buildIncidentWhere(user: { id: string; role: Role; unitId: string | null }, params: IncidentFilterParams) {
  const where: IncidentWhereInput = { AND: [scopeWhereForUser(user)] };
  const and = where.AND as IncidentWhereInput[];
  const activeFilter = activeIncidentFilter();
  if (activeFilter) and.push(activeFilter);

  if (params.from || params.to) {
    const occurredAt: Record<string, Date> = {};
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
  const started = Date.now();
  const where = buildIncidentWhere(user, params);
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const cursor = typeof params.cursor === "string" && params.cursor ? params.cursor : undefined;
  const [total, rows] = await Promise.all([
    prisma.incident.count({ where }),
    prisma.incident.findMany({
      where,
      select: incidentListSelect,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip: (page - 1) * INCIDENT_PAGE_SIZE }),
      take: INCIDENT_PAGE_SIZE + 1,
    }),
  ]);
  const hasNextPage = rows.length > INCIDENT_PAGE_SIZE;
  const data = rows.slice(0, INCIDENT_PAGE_SIZE);
  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] incident-list ${Date.now() - started}ms count=${data.length}`);
  }
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

export async function getIncidentExportRows(user: { id: string; role: Role; unitId: string | null }, params: IncidentFilterParams, take = 1000) {
  return prisma.incident.findMany({
    where: buildIncidentWhere(user, params),
    select: incidentListSelect,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take,
  });
}

export async function getIncidentForUser(id: string, user: { id: string; role: Role; unitId: string | null }) {
  const started = Date.now();
  const activeFilter = activeIncidentFilter();
  const incident = await prisma.incident.findFirst({
    where: { id, AND: [scopeWhereForUser(user), ...(activeFilter ? [activeFilter] : [])] } as any,
    include: {
      incidentUnit: true,
      reporterUnit: true,
      riskCode: true,
      reportedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } },
      comments: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      rca: {
        select: {
          id: true,
          problemStatement: true,
          timeline: true,
          contributingHuman: true,
          contributingProcess: true,
          contributingEquipment: true,
          contributingEnvironment: true,
          contributingCommunication: true,
          contributingIT: true,
          rootCause: true,
          preventiveAction: true,
          kpi: true,
          kpiOwnerId: true,
          needRmSupport: true,
          status: true,
          submittedAt: true,
          approvedAt: true,
          kpiOwner: { select: { id: true, name: true, email: true, role: true, unitId: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
        },
      },
      actionPlans: {
        include: {
          owner: { select: { id: true, name: true, email: true, role: true, unitId: true } },
          verifiedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });
  if (!incident) return null;
  const audits = await prisma.auditLog.findMany({ where: { entityType: "Incident", entityId: id }, include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 30 });
  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] incident-detail ${Date.now() - started}ms`);
  }
  return { ...incident, audits };
}

export const getActiveUsers = cache(async function getActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, unitId: true },
    orderBy: { name: "asc" },
  });
});

export function removeSensitiveIncidentStorage<T extends Record<string, any>>(incident: T) {
  const { hnEncrypted, anEncrypted, reporterNameEncrypted, ...rest } = incident;
  const sanitized = rest as Record<string, any>;
  if (sanitized.rca && typeof sanitized.rca === "object") {
    const { rcaEncrypted, ...rca } = sanitized.rca;
    sanitized.rca = rca;
  }
  return sanitized as Omit<T, "hnEncrypted" | "anEncrypted" | "reporterNameEncrypted">;
}

export function removeSensitiveIncidentIdentifiers<T extends Record<string, any>>(incident: T) {
  const reportedBy = incident.reportedBy
    ? { ...incident.reportedBy, name: "[RESTRICTED]" }
    : incident.reportedBy;
  return {
    ...removeSensitiveIncidentStorage(incident),
    reportedBy,
    patientHn: null,
    patientAn: null,
  };
}

export const getLookupData = cache(async function getLookupData() {
  const units = await prisma.unit.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true, isActive: true }, orderBy: { name: "asc" } });
  const riskCodes = await prisma.riskCode.findMany({ where: { isActive: true }, select: { id: true, code: true, nameTh: true, nameEn: true, clinicalOrGeneral: true, simpleCategory: true, isActive: true }, orderBy: { code: "asc" } });
  const simpleCategories = await prisma.riskCode.findMany({ where: { isActive: true }, distinct: ["simpleCategory"], select: { simpleCategory: true }, orderBy: { simpleCategory: "asc" } });
  return { units, riskCodes, simpleCategories: simpleCategories.map((s: { simpleCategory: string }) => s.simpleCategory) };
});
