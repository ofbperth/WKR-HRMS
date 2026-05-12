import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { safetyGoals } from "@/lib/dashboard-analytics";
import { severityWeights } from "@/lib/severity";

function monthRange(year: number, month: number) {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
}

export async function GET(request: Request) {
  try {
    await requireUser(["RMTeam", "Executive", "Admin"]);
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
    const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return Response.json({ error: "INVALID_MONTH" }, { status: 400 });
    const report = await prisma.monthlyReport.findUnique({ where: { year_month: { year, month } } });
    return Response.json(report);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const body = await request.json().catch(() => ({}));
    const year = Number(body.year ?? new Date().getFullYear());
    const month = Number(body.month ?? new Date().getMonth() + 1);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return Response.json({ error: "INVALID_MONTH" }, { status: 400 });
    const { start, end } = monthRange(year, month);
    const incidents = await prisma.incident.findMany({
      where: { occurredAt: { gte: start, lt: end } },
      include: { incidentUnit: true, riskCode: true, rca: true, actionPlans: true },
      orderBy: [{ isSentinel: "desc" }, { severity: "desc" }, { occurredAt: "desc" }],
    });
    const [total, closed, sentinel, rcaRequired, bySeverity, byUnit, topRiskCodes] = await Promise.all([
      prisma.incident.count({ where: { occurredAt: { gte: start, lt: end } } }),
      prisma.incident.count({ where: { occurredAt: { gte: start, lt: end }, status: "Closed" } }),
      prisma.incident.count({ where: { occurredAt: { gte: start, lt: end }, isSentinel: true } }),
      prisma.incident.count({ where: { occurredAt: { gte: start, lt: end }, status: "RCARequired" } }),
      prisma.incident.groupBy({ by: ["severity"], where: { occurredAt: { gte: start, lt: end } }, _count: true }),
      prisma.incident.groupBy({ by: ["incidentUnitId"], where: { occurredAt: { gte: start, lt: end } }, _count: true }),
      prisma.incident.groupBy({ by: ["riskCodeId"], where: { occurredAt: { gte: start, lt: end } }, _count: true }),
    ]);
    const unitMap = new Map(incidents.map(i => [i.incidentUnitId, i.incidentUnit.name]));
    const riskMap = new Map(incidents.map(i => [i.riskCodeId, `${i.riskCode.code} ${i.riskCode.nameTh}`]));
    const topUnitsByCount = byUnit.map(item => ({ unit: unitMap.get(item.incidentUnitId) ?? item.incidentUnitId, count: item._count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topUnitsByScore = Array.from(incidents.reduce((map, item) => {
      const current = map.get(item.incidentUnit.name) ?? { unit: item.incidentUnit.name, score: 0, count: 0 };
      current.score += severityWeights[item.severity] ?? 0;
      current.count += 1;
      map.set(item.incidentUnit.name, current);
      return map;
    }, new Map<string, { unit: string; score: number; count: number }>()).values()).sort((a, b) => b.score - a.score).slice(0, 5);
    const topRiskCodeRows = topRiskCodes.map(item => ({ riskCode: riskMap.get(item.riskCodeId) ?? item.riskCodeId, count: item._count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const riskTopByType = (type: string) => Array.from(incidents.filter(item => item.clinicalOrGeneral === type).reduce((map, item) => {
      const key = `${item.riskCode.code} ${item.riskCode.nameTh}`;
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries()).map(([riskCode, count]) => ({ riskCode, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const safetyGoalRows = safetyGoals.map(goal => ({ title: goal.title, count: incidents.filter(item => goal.codes.includes(item.riskCode.code)).length })).sort((a, b) => b.count - a.count).slice(0, 5);
    const sentinelEvents = incidents.filter(item => item.isSentinel).map(item => ({ incidentNo: item.incidentNo, occurredAt: item.occurredAt, unit: item.incidentUnit.name, severity: item.severity, riskCode: item.riskCode.code, title: item.title, status: item.status }));
    const overdueActions = incidents.flatMap(item => item.actionPlans).filter(action => action.status !== "Verified" && action.dueDate < new Date()).length;
    const summary = { year, month, total, closed, sentinel, rcaRequired, overdueActions, bySeverity, topUnitsByCount, topUnitsByScore, topRiskCodes: topRiskCodeRows, topClinicalRisk: riskTopByType("Clinical"), topGeneralRisk: riskTopByType("General"), topSafetyGoals: safetyGoalRows, sentinelEvents };
    const report = await prisma.monthlyReport.upsert({
      where: { year_month: { year, month } },
      update: { summaryJson: JSON.stringify(summary), generatedAt: new Date(), generatedBySystem: false },
      create: { year, month, summaryJson: JSON.stringify(summary), generatedBySystem: false },
    });
    await auditLog({ userId: user.id, action: "generate monthly report", entityType: "MonthlyReport", entityId: report.id, newValue: summary });
    return Response.json(report, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
