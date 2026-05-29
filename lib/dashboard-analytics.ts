import { prisma } from "@/lib/prisma";
import { activeIncidentFilter } from "@/lib/prisma-fields";
import { getDashboardFilterLookups, getLookupData } from "@/lib/incident-query";
import { clinicalHighSeverity, generalHighSeverity, severityWeights } from "@/lib/severity";
import { INCIDENT_STATUS_VALUES, SEVERITY_VALUES } from "@/lib/types";

export type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  unitId?: string;
  clinicalOrGeneral?: string;
  simpleCategory?: string | string[];
  yMode?: string;
  includeClosed?: string;
  scopeUnitId?: string | null;
};

const highSeverity = [...clinicalHighSeverity, ...generalHighSeverity] as readonly string[];
const fiscalYearStartMonth = 9;

export const safetyGoals = [
  { id: "safe-surgery", title: "การผ่าตัดผิดคน ผิดข้าง ผิดตำแหน่ง ผิดหัตถการ", codes: ["CPS101", "CPS102", "CPS103"] },
  { id: "infection", title: "การติดเชื้อที่สำคัญในสถานพยาบาลในผู้ป่วย ได้แก่ SSI, VAP, CAUTI, CABSI", codes: ["CPI201", "CPI202", "CPI203", "CPS111"] },
  { id: "medication", title: "บุคลากรติดเชื้อจากการปฏิบัติหน้าที่", codes: ["GPI201", "GPI202", "GPI203", "GPI204"] },
  { id: "blood", title: "การเกิด Medication Error และ Adverse Drug Event", codes: ["CPM101", "CPM201", "CPM202", "CPM203", "CPM204", "CPM205"] },
  { id: "patient-id", title: "การให้เลือดผิดคน ผิดหมู่ ผิดชนิด", codes: ["CPM501"] },
  { id: "communication", title: "การระบุตัวผู้ป่วยผิดพลาด", codes: ["CPP101"] },
  { id: "fall-pressure", title: "ความคลาดเคลื่อนในการวินิจฉัยโรค", codes: ["CPP301"] },
  { id: "refer-transfer", title: "การรายงานผลการตรวจทางห้องปฏิบัติการ/พยาธิวิทยาคลาดเคลื่อน", codes: ["CPL201", "CPL203"] },
  { id: "deteriorating", title: "การคัดกรองที่ห้องฉุกเฉินคลาดเคลื่อน", codes: ["CPE402", "CPE403", "CPE405", "CPE407"] },
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
  and.push({ status: { not: "Rejected" } });
  const start = toDate(filters.startDate);
  const end = toDate(filters.endDate, true);
  if (start || end) and.push({ occurredAt: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } });
  if (filters.scopeUnitId) and.push({ incidentUnitId: filters.scopeUnitId });
  else if (filters.unitId) and.push({ incidentUnitId: filters.unitId });
  if (filters.clinicalOrGeneral) and.push({ clinicalOrGeneral: filters.clinicalOrGeneral });
  const simpleCategories = Array.isArray(filters.simpleCategory)
    ? filters.simpleCategory.filter(Boolean)
    : filters.simpleCategory
      ? [filters.simpleCategory]
      : [];
  if (simpleCategories.length === 1) and.push({ simpleCategory: simpleCategories[0] });
  if (simpleCategories.length > 1) and.push({ simpleCategory: { in: simpleCategories } });
  return and.length ? { AND: and } : {};
}

function withExtra(base: any, extra: any) {
  return { AND: [base, extra] };
}

export function buildOverdueRcaWhere(base: any, now = new Date()) {
  return withExtra(base, {
    status: "RCARequired",
    rcaDueAt: { lt: now },
    OR: [{ rca: null }, { rca: { status: { in: ["Draft", "RevisionRequired"] } } }],
  });
}

function groupValue(rows: Array<{ [key: string]: any; _count: number }>, key: string, name: string) {
  return rows.find((item) => item[key] === name)?._count ?? 0;
}

function percent(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

function monthKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 7);
}

function trend(items: Array<{ occurredAt: Date; severity: string; isSentinel: boolean }>) {
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

async function runBatched<T extends readonly (() => Promise<unknown>)[]>(tasks: T, batchSize = 6) {
  const results: unknown[] = [];
  for (let index = 0; index < tasks.length; index += batchSize) {
    const batch = tasks.slice(index, index + batchSize);
    results.push(...await Promise.all(batch.map((task) => task())));
  }
  return results as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
}

function summarizeDimension(rows: Array<{ severity: string; _count: number; [key: string]: any }>, key: string, label: string, names: Map<string, string>, extras?: Map<string, Record<string, unknown>>) {
  const map = new Map<string, { name: string; value: number; score: number; openRca: number; overdueActions: number; extra: Record<string, unknown> }>();
  for (const row of rows) {
    const id = row[key] ?? "Unclassified";
    const current = map.get(id) ?? { name: names.get(id) ?? id, value: 0, score: 0, openRca: 0, overdueActions: 0, extra: extras?.get(id) ?? {} };
    current.value += row._count;
    current.score += (severityWeights[row.severity] ?? 0) * row._count;
    map.set(id, current);
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10).map(({ extra, ...item }) => ({ [label]: item.name, ...item, ...extra }));
}

async function commonLookups() {
  const lookup = await getLookupData();
  const unitNames = new Map(lookup.units.map((unit) => [unit.id, unit.name]));
  const riskNames = new Map(lookup.riskCodes.map((risk) => [risk.id, `${risk.code} ${risk.nameTh}`]));
  const riskExtras = new Map(lookup.riskCodes.map((risk) => [risk.id, { riskCodeId: risk.id }]));
  const unitExtras = new Map(lookup.units.map((unit) => [unit.id, { unitId: unit.id }]));
  return { lookup, unitNames, riskNames, riskExtras, unitExtras };
}

async function commonFilterLookups() {
  const lookup = await getDashboardFilterLookups();
  const unitNames = new Map(lookup.units.map((unit) => [unit.id, unit.name]));
  return { lookup, unitNames };
}

export async function getDashboardSummary(filters: AnalyticsFilters = {}) {
  const started = Date.now();
  const where = buildIncidentWhere(filters);
  const now = new Date();
  const month = getThisMonthRange(now);
  const fiscal = getFiscalYearRange(now);
  const { lookup } = await commonFilterLookups();

  const [
    total,
    totalThisMonth,
    totalFiscalYear,
    statusRows,
    severityRows,
    openActions,
    overdueActions,
    openRca,
    rcaRevisionRequired,
    rcaScope,
    rcaSubmitted,
    overdueRca,
    sentinel,
    needRmSupport,
    highSeverityCount,
    leadershipDecision,
    rcaRequired,
    rcaWaitingApproval,
  ] = await runBatched([
    () => prisma.incident.count({ where }),
    () => prisma.incident.count({ where: withExtra(where, { occurredAt: { gte: month.start, lte: month.end } }) }),
    () => prisma.incident.count({ where: withExtra(where, { occurredAt: { gte: fiscal.start, lte: fiscal.end } }) }),
    () => prisma.incident.groupBy({ by: ["status"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["severity"], where, _count: true }),
    () => prisma.actionPlan.count({ where: { incident: where, status: { not: "Verified" } } }),
    () => prisma.actionPlan.count({ where: { incident: where, status: { not: "Verified" }, dueDate: { lt: now } } }),
    () => prisma.rCA.count({ where: { incident: where, status: { not: "Approved" } } }),
    () => prisma.rCA.count({ where: { incident: where, status: "RevisionRequired" } }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: { in: ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"] } }, { rca: { isNot: null } }] }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: { in: ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"] } }, { rca: { status: { in: ["Submitted", "Approved"] } } }] }) }),
    () => prisma.incident.count({ where: buildOverdueRcaWhere(where, now) }),
    () => prisma.incident.count({ where: withExtra(where, { isSentinel: true }) }),
    () => prisma.incident.count({ where: withExtra(where, { needRmSupport: true }) }),
    () => prisma.incident.count({ where: withExtra(where, { severity: { in: [...highSeverity] } }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ isSentinel: true }, { severity: { in: ["G", "H", "I", "5"] } }] }) }),
    () => prisma.incident.count({ where: withExtra(where, { status: "RCARequired", rca: null }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: "RCASubmitted" }, { rca: { status: "Submitted" } }] }) }),
  ]) as any;

  const highestSeverityLabel = [...severityRows].sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0]?.severity ?? "";

  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] dashboard-summary ${Date.now() - started}ms`);
  }

  return {
    filters: { units: lookup.units, categories: lookup.simpleCategories },
    cards: {
      totalThisMonth,
      totalFiscalYear,
      total,
      newIncidents: groupValue(statusRows as any, "status", "New"),
      underReview: groupValue(statusRows as any, "status", "UnderReview"),
      rcaRequired,
      rcaWaitingApproval,
      rcaSubmittedRate: percent(rcaSubmitted, rcaScope),
      overdueRca,
      openRca,
      rcaRevisionRequired,
      openActions,
      overdueActions,
      closedIncidents: groupValue(statusRows as any, "status", "Closed"),
      closedCaseRate: percent(groupValue(statusRows as any, "status", "Closed"), total),
      needLeadershipDecision: leadershipDecision,
      needRmSupport,
      sentinel,
      highSeverity: highSeverityCount,
      waitingVerification: groupValue(statusRows as any, "status", "WaitingVerification"),
      highestSeverity: highestSeverityLabel ? severityWeights[highestSeverityLabel] ?? 0 : 0,
      highestSeverityLabel,
    },
  };
}

export async function getDashboardAnalytics(filters: AnalyticsFilters = {}) {
  const started = Date.now();
  const where = buildIncidentWhere(filters);
  const now = new Date();
  const month = getThisMonthRange(now);
  const fiscal = getFiscalYearRange(now);
  const last12Months = getLast12MonthsRange(now);
  const { lookup, unitNames, riskNames, riskExtras, unitExtras } = await commonLookups();

  const [
    total,
    totalThisMonth,
    totalFiscalYear,
    statusRows,
    severityRows,
    clinicalRows,
    categorySeverityRows,
    riskSeverityRows,
    unitSeverityRows,
    rcaStatusRows,
    actionStatusRows,
    openActions,
    overdueActions,
    openRca,
    rcaRevisionRequired,
    rcaScope,
    rcaSubmitted,
    overdueRca,
    sentinel,
    needRmSupport,
    highSeverityCount,
    leadershipDecision,
    rcaRequired,
    rcaWaitingApproval,
    trendRows,
    sentinelRows,
    openRcaRows,
    overdueActionRows,
  ] = await runBatched([
    () => prisma.incident.count({ where }),
    () => prisma.incident.count({ where: withExtra(where, { occurredAt: { gte: month.start, lte: month.end } }) }),
    () => prisma.incident.count({ where: withExtra(where, { occurredAt: { gte: fiscal.start, lte: fiscal.end } }) }),
    () => prisma.incident.groupBy({ by: ["status"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["severity"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["clinicalOrGeneral"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["simpleCategory", "severity"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["riskCodeId", "severity"], where, _count: true }),
    () => prisma.incident.groupBy({ by: ["incidentUnitId", "severity"], where, _count: true }),
    () => prisma.rCA.groupBy({ by: ["status"], where: { incident: where }, _count: true }),
    () => prisma.actionPlan.groupBy({ by: ["status"], where: { incident: where }, _count: true }),
    () => prisma.actionPlan.count({ where: { incident: where, status: { not: "Verified" } } }),
    () => prisma.actionPlan.count({ where: { incident: where, status: { not: "Verified" }, dueDate: { lt: now } } }),
    () => prisma.rCA.count({ where: { incident: where, status: { not: "Approved" } } }),
    () => prisma.rCA.count({ where: { incident: where, status: "RevisionRequired" } }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: { in: ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"] } }, { rca: { isNot: null } }] }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: { in: ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"] } }, { rca: { status: { in: ["Submitted", "Approved"] } } }] }) }),
    () => prisma.incident.count({ where: buildOverdueRcaWhere(where, now) }),
    () => prisma.incident.count({ where: withExtra(where, { isSentinel: true }) }),
    () => prisma.incident.count({ where: withExtra(where, { needRmSupport: true }) }),
    () => prisma.incident.count({ where: withExtra(where, { severity: { in: [...highSeverity] } }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ isSentinel: true }, { severity: { in: ["G", "H", "I", "5"] } }] }) }),
    () => prisma.incident.count({ where: withExtra(where, { status: "RCARequired", rca: null }) }),
    () => prisma.incident.count({ where: withExtra(where, { OR: [{ status: "RCASubmitted" }, { rca: { status: "Submitted" } }] }) }),
    () => prisma.incident.findMany({ where: withExtra(where, { occurredAt: { gte: last12Months.start, lte: last12Months.end } }), select: { occurredAt: true, severity: true, isSentinel: true }, orderBy: { occurredAt: "desc" }, take: 1200 }),
    () => prisma.incident.findMany({ where: withExtra(where, { isSentinel: true }), select: { id: true, incidentNo: true, occurredAt: true, incidentUnit: { select: { name: true } }, severity: true, riskCode: { select: { code: true } }, title: true, status: true }, orderBy: { occurredAt: "desc" }, take: 5 }),
    () => prisma.rCA.findMany({ where: { incident: where, status: { not: "Approved" } }, select: { incident: { select: { incidentUnitId: true, severity: true } } }, take: 1000 }),
    () => prisma.actionPlan.findMany({ where: { incident: where, status: { not: "Verified" }, dueDate: { lt: now } }, select: { incident: { select: { incidentUnitId: true, severity: true } } }, take: 1000 }),
  ]) as any;

  const categoryNames = new Map(lookup.simpleCategories.map((category) => [category, category]));
  const highestSeverityLabel = [...severityRows].sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0]?.severity ?? "";
  const dimensionFromIncidents = (rows: Array<{ incident: { incidentUnitId: string; severity: string } }>) => {
    const grouped = rows.map((row) => ({ incidentUnitId: row.incident.incidentUnitId, severity: row.incident.severity, _count: 1 }));
    return summarizeDimension(grouped, "incidentUnitId", "unit", unitNames, unitExtras);
  };

  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] dashboard ${Date.now() - started}ms`);
  }

  return {
    filters: { units: lookup.units, categories: lookup.simpleCategories },
    cards: {
      totalThisMonth,
      totalFiscalYear,
      total,
      newIncidents: groupValue(statusRows as any, "status", "New"),
      underReview: groupValue(statusRows as any, "status", "UnderReview"),
      rcaRequired,
      rcaWaitingApproval,
      rcaSubmittedRate: percent(rcaSubmitted, rcaScope),
      overdueRca,
      openRca,
      rcaRevisionRequired,
      openActions,
      overdueActions,
      closedIncidents: groupValue(statusRows as any, "status", "Closed"),
      closedCaseRate: percent(groupValue(statusRows as any, "status", "Closed"), total),
      needLeadershipDecision: leadershipDecision,
      needRmSupport,
      sentinel,
      highSeverity: highSeverityCount,
      waitingVerification: groupValue(statusRows as any, "status", "WaitingVerification"),
      highestSeverity: highestSeverityLabel ? severityWeights[highestSeverityLabel] ?? 0 : 0,
      highestSeverityLabel,
    },
    charts: {
      trend: trend(trendRows),
      severity: SEVERITY_VALUES.map((name) => ({ name, value: groupValue(severityRows as any, "severity", name) })),
      status: INCIDENT_STATUS_VALUES.map((name) => ({ name, value: groupValue(statusRows as any, "status", name) })),
      clinicalGeneral: ["Clinical", "General"].map((name) => ({ name, value: groupValue(clinicalRows as any, "clinicalOrGeneral", name) })),
      simpleCategory: summarizeDimension(categorySeverityRows as any, "simpleCategory", "category", categoryNames),
      topRiskCodes: summarizeDimension(riskSeverityRows as any, "riskCodeId", "riskCode", riskNames, riskExtras),
      topRecurrentRiskCodes: summarizeDimension(riskSeverityRows as any, "riskCodeId", "riskCode", riskNames, riskExtras).slice(0, 5),
      topUnits: summarizeDimension(unitSeverityRows as any, "incidentUnitId", "unit", unitNames, unitExtras),
      weightedUnits: summarizeDimension(unitSeverityRows as any, "incidentUnitId", "unit", unitNames, unitExtras).sort((a, b) => b.score - a.score),
      rcaStatus: ["Draft", "Submitted", "Approved", "RevisionRequired"].map((name) => ({ name, value: groupValue(rcaStatusRows as any, "status", name) })),
      actionStatus: ["NotStarted", "Ongoing", "Done", "Delayed", "Verified"].map((name) => ({ name, value: groupValue(actionStatusRows as any, "status", name) })),
      openRcaByUnit: dimensionFromIncidents(openRcaRows),
      overdueActionByUnit: dimensionFromIncidents(overdueActionRows),
      lastSentinelEvents: sentinelRows.map((item: any) => ({
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
  const started = Date.now();
  const where = buildIncidentWhere(filters);
  const { lookup, unitNames } = await commonFilterLookups();
  const yMode = filters.yMode === "simpleCategory" ? "simpleCategory" : "severity";
  const yValues = yMode === "simpleCategory" ? lookup.simpleCategories : [...SEVERITY_VALUES];
  const grouped = await prisma.incident.groupBy({
    by: yMode === "simpleCategory" ? ["incidentUnitId", "simpleCategory", "severity"] : ["incidentUnitId", "severity"],
    where,
    _count: true,
  } as any);
  const unitScores = new Map<string, number>();
  for (const row of grouped as any[]) {
    unitScores.set(row.incidentUnitId, (unitScores.get(row.incidentUnitId) ?? 0) + (severityWeights[row.severity] ?? 0) * row._count);
  }
  const groupedByCell = new Map<string, { count: number; score: number; highestSeverity: string }>();
  for (const row of grouped as any[]) {
    const yValue = yMode === "simpleCategory" ? row.simpleCategory : row.severity;
    const key = `${row.incidentUnitId}\u0000${yValue}`;
    const current = groupedByCell.get(key) ?? { count: 0, score: 0, highestSeverity: "-" };
    const weight = severityWeights[row.severity] ?? 0;
    current.count += row._count;
    current.score += weight * row._count;
    if (weight > (severityWeights[current.highestSeverity] ?? 0)) current.highestSeverity = row.severity;
    groupedByCell.set(key, current);
  }
  const orderedUnits = [...lookup.units].sort((a, b) => (unitScores.get(b.id) ?? 0) - (unitScores.get(a.id) ?? 0));
  const rows = yValues.map((row) => ({
    row,
    cells: orderedUnits.map((unit) => {
      const cell = groupedByCell.get(`${unit.id}\u0000${row}`);
      return { unitId: unit.id, unit: unitNames.get(unit.id) ?? unit.name, row, count: cell?.count ?? 0, score: cell?.score ?? 0, highestSeverity: cell?.highestSeverity ?? "-", openRca: 0, overdueActions: 0 };
    }),
  }));
  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] heatmap ${Date.now() - started}ms cells=${orderedUnits.length * yValues.length}`);
  }
  return { units: orderedUnits, yMode, rows };
}

export async function getSafetyGoalAnalytics(filters: AnalyticsFilters = {}) {
  const where = buildIncidentWhere({ ...filters, includeClosed: "true" });
  const { lookup } = await commonLookups();
  const riskByCode = new Map(lookup.riskCodes.map((risk) => [risk.code, risk.id]));
  const riskIdsByGoal = new Map(safetyGoals.map((goal) => [goal.id, goal.codes.map((code) => riskByCode.get(code)).filter(Boolean) as string[]]));
  const allRiskCodeIds = [...new Set(Array.from(riskIdsByGoal.values()).flat())];
  const now = new Date();
  const rows = allRiskCodeIds.length ? await prisma.incident.findMany({
    where: withExtra(where, { riskCodeId: { in: allRiskCodeIds } }),
    select: {
      riskCodeId: true,
      occurredAt: true,
      severity: true,
      isSentinel: true,
      rca: { select: { status: true } },
      actionPlans: { select: { status: true, dueDate: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 5000,
  }) : [];
  return safetyGoals.map((goal) => {
    const riskCodeIds = new Set(riskIdsByGoal.get(goal.id) ?? []);
    const goalRows = rows.filter((row) => riskCodeIds.has(row.riskCodeId));
    const severityRows = Array.from(goalRows.reduce((map, row) => {
      map.set(row.severity, (map.get(row.severity) ?? 0) + 1);
      return map;
    }, new Map<string, number>())).map(([severity, count]) => ({ severity, _count: count }));
    const openRca = goalRows.filter((row) => row.rca && row.rca.status !== "Approved").length;
    const overdueActions = goalRows.reduce((sum, row) => sum + row.actionPlans.filter((action) => action.status !== "Verified" && action.dueDate < now).length, 0);
    const highestSeverity = [...severityRows].sort((a, b) => (severityWeights[b.severity] ?? 0) - (severityWeights[a.severity] ?? 0))[0]?.severity ?? "-";
    const monthly = trend(goalRows);
    const increasing = monthly.length >= 2 && monthly[monthly.length - 1].total > monthly[monthly.length - 2].total;
    const critical = ["G", "H", "I", "5"].includes(highestSeverity) || overdueActions > 0;
    const watch = !critical && (["E", "F", "3", "4"].includes(highestSeverity) || openRca > 0 || increasing);
    return { ...goal, count: goalRows.length, highestSeverity, trend: monthly, openRca, overdueActions, status: critical ? "Critical" : watch ? "Watch" : "Good", relatedRiskCodes: goal.codes };
  });
}
