import { prisma } from "@/lib/prisma";
import { activeIncidentFilter } from "@/lib/prisma-fields";
import { clinicalHighSeverity, generalHighSeverity, severityWeights } from "@/lib/severity";
import { INCIDENT_STATUS_VALUES, SEVERITY_VALUES } from "@/lib/types";

export type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  unitId?: string;
  clinicalOrGeneral?: string;
  simpleCategory?: string;
  includeClosed?: string;
  scopeUnitId?: string | null;
};

const highSeverity = [...clinicalHighSeverity, ...generalHighSeverity] as readonly string[];
const fiscalYearStartMonth = 9;

export const safetyGoals = [
  { id: "safe-surgery", title: "Safe Surgery / Wrong Site Surgery", codes: ["CPS101", "CPS102", "CPS103"] },
  { id: "infection", title: "Infection: CAUTI/VAP/CLABSI/SSI", codes: ["CPS111", "CPI201", "CPI202", "CPI203"] },
  { id: "medication", title: "Medication Safety", codes: ["CPM201", "CPM202", "CPM203", "CPM204", "CPM205", "CPM206", "CPM207", "CPM208"] },
  { id: "blood", title: "Blood Transfusion Safety", codes: ["CPM501"] },
  { id: "patient-id", title: "Patient Identification", codes: ["CPP101"] },
  { id: "communication", title: "Communication / Critical Result / Handover", codes: ["CPP201", "CPL201"] },
  { id: "fall-pressure", title: "Fall / Pressure Injury / Common Complication", codes: ["CPP401"] },
  { id: "refer-transfer", title: "Refer & Transfer / ER Safety", codes: ["CPE401", "CPE402"] },
  { id: "deteriorating", title: "Deteriorating Patient / Sepsis / Emergency Response", codes: ["CPE101", "CPE201"] },
];

function toDate(value?: string, end = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${end ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getFiscalYearRange(now = new Date()) {
  const year = now.getMonth() >= fiscalYearStartMonth ? now.getFullYear() : now.getFullYear() - 1;
  return { start: new Date(year, fiscalYearStartMonth, 1), end: new Date(year + 1, fiscalYearStartMonth, 0, 23, 59, 59) };
}

export function getThisMonthRange(now = new Date()) {
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
}

export function getLast12MonthsRange(now = new Date()) {
  return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
}

export function buildIncidentWhere(filters: AnalyticsFilters = {}) {
  const and: any[] = [];
  const activeFilter = activeIncidentFilter();
  if (activeFilter) and.push(activeFilter);
  const start = toDate(filters.startDate);
  const end = toDate(filters.endDate, true);
  if (start || end) and.push({ occurredAt: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } });
  if (filters.scopeUnitId) and.push({ incidentUnitId: filters.scopeUnitId });
  else if (filters.unitId) and.push({ incidentUnitId: filters.unitId });
  if (filters.clinicalOrGeneral) and.push({ clinicalOrGeneral: filters.clinicalOrGeneral });
  if (filters.simpleCategory) and.push({ simpleCategory: filters.simpleCategory });
  if (filters.includeClosed !== "true") and.push({ status: { notIn: ["Closed", "Rejected"] } });
  return and.length ? { AND: and } : {};
}

async function loadData(filters: AnalyticsFilters = {}) {
  const where = buildIncidentWhere(filters);
  const incidents = await prisma.incident.findMany({
    where,
    include: { incidentUnit: true, riskCode: true, rca: true, actionPlans: true },
    orderBy: { occurredAt: "desc" },
  });
  const units = await prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const categories = await prisma.riskCode.findMany({ where: { isActive: true }, distinct: ["simpleCategory"], select: { simpleCategory: true }, orderBy: { simpleCategory: "asc" } });
  return { incidents: incidents as any[], units, categories: categories.map((item: any) => item.simpleCategory) };
}

function monthKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 7);
}

function countBy<T extends string>(items: any[], keys: readonly T[], selector: (item: any) => string) {
  return keys.map(key => ({ name: key, value: items.filter(item => selector(item) === key).length }));
}

function topMap(items: any[], keyFn: (item: any) => string, label = "name", extraFn?: (item: any) => Record<string, unknown>) {
  const map = new Map<string, { name: string; value: number; score: number; openRca: number; overdueActions: number; extra: Record<string, unknown> }>();
  for (const item of items) {
    const name = keyFn(item) || "Unclassified";
    const current = map.get(name) ?? { name, value: 0, score: 0, openRca: 0, overdueActions: 0, extra: extraFn?.(item) ?? {} };
    current.value += 1;
    current.score += severityWeights[item.severity] ?? 0;
    if (item.rca && item.rca.status !== "Approved") current.openRca += 1;
    current.overdueActions += (item.actionPlans ?? []).filter((action: any) => action.status !== "Verified" && new Date(action.dueDate) < new Date()).length;
    map.set(name, current);
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10).map(({ extra, ...item }) => ({ [label]: item.name, ...item, ...extra }));
}

function percent(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

function trend(items: any[]) {
  const map = new Map<string, { month: string; total: number; high: number; sentinel: number; nearMiss: number; nearMissRate: number }>();
  for (const item of items) {
    const key = monthKey(item.occurredAt);
    const current = map.get(key) ?? { month: key, total: 0, high: 0, sentinel: 0, nearMiss: 0, nearMissRate: 0 };
    current.total += 1;
    if (highSeverity.includes(item.severity)) current.high += 1;
    if (item.isSentinel) current.sentinel += 1;
    if (["A", "B"].includes(item.severity)) current.nearMiss += 1;
    current.nearMissRate = percent(current.nearMiss, current.total);
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}

function closedRate(items: any[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter(item => item.status === "Closed").length / items.length) * 100);
}

export async function getDashboardAnalytics(filters: AnalyticsFilters = {}) {
  const { incidents, units, categories } = await loadData(filters);
  const now = new Date();
  const month = getThisMonthRange(now);
  const fiscal = getFiscalYearRange(now);
  const overdueActions = incidents.flatMap(item => item.actionPlans ?? []).filter((action: any) => action.status !== "Verified" && new Date(action.dueDate) < now);
  const openRca = incidents.filter(item => item.rca && item.rca.status !== "Approved");
  const rcaScope = incidents.filter(item => ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"].includes(item.status) || item.rca);
  const rcaSubmitted = rcaScope.filter(item => ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"].includes(item.status) || ["Submitted", "Approved"].includes(item.rca?.status ?? ""));
  const highestSeverityItem = incidents.slice().sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0];
  return {
    filters: { units, categories },
    cards: {
      totalThisMonth: incidents.filter(item => new Date(item.occurredAt) >= month.start && new Date(item.occurredAt) <= month.end).length,
      totalFiscalYear: incidents.filter(item => new Date(item.occurredAt) >= fiscal.start && new Date(item.occurredAt) <= fiscal.end).length,
      total: incidents.length,
      newIncidents: incidents.filter(item => item.status === "New").length,
      underReview: incidents.filter(item => item.status === "UnderReview").length,
      rcaRequired: incidents.filter(item => item.status === "RCARequired" && !item.rca).length,
      rcaWaitingApproval: incidents.filter(item => item.status === "RCASubmitted" || item.rca?.status === "Submitted").length,
      rcaSubmittedRate: percent(rcaSubmitted.length, rcaScope.length),
      openRca: openRca.length,
      rcaRevisionRequired: incidents.filter(item => item.rca?.status === "RevisionRequired").length,
      openActions: incidents.flatMap(item => item.actionPlans ?? []).filter((action: any) => action.status !== "Verified").length,
      overdueActions: overdueActions.length,
      closedCaseRate: closedRate(incidents),
      needLeadershipDecision: incidents.filter(item => item.isSentinel || ["G", "H", "I", "5"].includes(item.severity)).length,
      needRmSupport: incidents.filter(item => item.needRmSupport).length,
      sentinel: incidents.filter(item => item.isSentinel).length,
      highSeverity: incidents.filter(item => highSeverity.includes(item.severity)).length,
      waitingVerification: incidents.filter(item => item.status === "WaitingVerification").length,
      highestSeverity: highestSeverityItem ? severityWeights[highestSeverityItem.severity] ?? 0 : 0,
      highestSeverityLabel: highestSeverityItem?.severity ?? "",
    },
    charts: {
      trend: trend(incidents),
      severity: countBy(incidents, SEVERITY_VALUES, item => item.severity),
      status: countBy(incidents, INCIDENT_STATUS_VALUES, item => item.status),
      clinicalGeneral: ["Clinical", "General"].map(name => ({ name, value: incidents.filter(item => item.clinicalOrGeneral === name).length })),
      simpleCategory: topMap(incidents, item => item.simpleCategory, "category"),
      topRiskCodes: topMap(incidents, item => `${item.riskCode?.code ?? "-"} ${item.riskCode?.nameTh ?? ""}`, "riskCode", item => ({ riskCodeId: item.riskCodeId })),
      topRecurrentRiskCodes: topMap(incidents, item => `${item.riskCode?.code ?? "-"} ${item.riskCode?.nameTh ?? ""}`, "riskCode", item => ({ riskCodeId: item.riskCodeId })).slice(0, 5),
      topUnits: topMap(incidents, item => item.incidentUnit?.name, "unit", item => ({ unitId: item.incidentUnitId })),
      weightedUnits: topMap(incidents, item => item.incidentUnit?.name, "unit", item => ({ unitId: item.incidentUnitId })).sort((a, b) => b.score - a.score),
      rcaStatus: ["Draft", "Submitted", "Approved", "RevisionRequired"].map(name => ({ name, value: incidents.filter(item => item.rca?.status === name).length })),
      actionStatus: ["NotStarted", "Ongoing", "Done", "Delayed", "Verified"].map(name => ({ name, value: incidents.flatMap(item => item.actionPlans ?? []).filter((action: any) => action.status === name).length })),
      openRcaByUnit: topMap(incidents.filter(item => item.rca && item.rca.status !== "Approved"), item => item.incidentUnit?.name, "unit", item => ({ unitId: item.incidentUnitId })),
      overdueActionByUnit: topMap(incidents.filter(item => (item.actionPlans ?? []).some((action: any) => action.status !== "Verified" && new Date(action.dueDate) < now)), item => item.incidentUnit?.name, "unit", item => ({ unitId: item.incidentUnitId })),
      lastSentinelEvents: incidents
        .filter(item => item.isSentinel)
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          incidentNo: item.incidentNo,
          occurredAt: item.occurredAt,
          unit: item.incidentUnit?.name ?? "-",
          severity: item.severity,
          riskCode: item.riskCode?.code ?? "-",
          title: item.title,
          status: item.status,
        })),
    },
  };
}

export async function getHeatmapAnalytics(filters: AnalyticsFilters = {}) {
  const { incidents, units, categories } = await loadData(filters);
  const orderedUnits = [...units].sort((a: { id: string }, b: { id: string }) => {
    const scoreA = incidents.filter(item => item.incidentUnitId === a.id).reduce((sum, item) => sum + (severityWeights[item.severity] ?? 0), 0);
    const scoreB = incidents.filter(item => item.incidentUnitId === b.id).reduce((sum, item) => sum + (severityWeights[item.severity] ?? 0), 0);
    return scoreB - scoreA;
  });
  const yMode = filters.simpleCategory === "__Y_SIMPLE__" ? "simpleCategory" : "severity";
  const yValues = yMode === "simpleCategory" ? categories : [...SEVERITY_VALUES];
  const rows = yValues.map((row: string) => ({
    row,
      cells: orderedUnits.map((unit: { id: string; name: string }) => {
      const scoped = incidents.filter(item => item.incidentUnitId === unit.id && (yMode === "simpleCategory" ? item.simpleCategory === row : item.severity === row));
      const score = scoped.reduce((sum, item) => sum + (severityWeights[item.severity] ?? 0), 0);
      return {
        unitId: unit.id,
        unit: unit.name,
        row,
        count: scoped.length,
        score,
        highestSeverity: scoped.sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0]?.severity ?? "-",
        openRca: scoped.filter(item => item.rca && item.rca.status !== "Approved").length,
        overdueActions: scoped.flatMap(item => item.actionPlans ?? []).filter((action: any) => action.status !== "Verified" && new Date(action.dueDate) < new Date()).length,
      };
    }),
  }));
  return { units: orderedUnits, yMode, rows };
}

export async function getSafetyGoalAnalytics(filters: AnalyticsFilters = {}) {
  const { incidents } = await loadData({ ...filters, includeClosed: "true" });
  return safetyGoals.map(goal => {
    const scoped = incidents.filter(item => goal.codes.includes(item.riskCode?.code));
    const overdue = scoped.flatMap(item => item.actionPlans ?? []).filter((action: any) => action.status !== "Verified" && new Date(action.dueDate) < new Date()).length;
    const openRca = scoped.filter(item => item.rca && item.rca.status !== "Approved").length;
    const highest = scoped.sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0]?.severity ?? "-";
    const monthly = trend(scoped);
    const increasing = monthly.length >= 2 && monthly[monthly.length - 1].total > monthly[monthly.length - 2].total;
    const critical = scoped.some(item => ["G", "H", "I", "5"].includes(item.severity) || item.isSentinel) || overdue > 0;
    const watch = !critical && (scoped.some(item => ["E", "F", "3", "4"].includes(item.severity)) || openRca > 0 || increasing);
    return {
      ...goal,
      count: scoped.length,
      highestSeverity: highest,
      trend: monthly,
      openRca,
      overdueActions: overdue,
      status: critical ? "Critical" : watch ? "Watch" : "Good",
      relatedRiskCodes: goal.codes,
    };
  });
}
