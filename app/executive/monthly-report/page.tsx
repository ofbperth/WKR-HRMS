import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavePdfButton } from "@/components/reports/save-pdf-button";
import { SummaryReportFilter } from "@/components/reports/summary-report-filter";
import { safetyGoals } from "@/lib/dashboard-analytics";
import { severityWeights } from "@/lib/severity";

type ReportRange = { start: Date; end: Date; label: string; mode: string };

function parseMonth(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function normalizeFiscalYear(value: string | undefined) {
  const now = new Date();
  const raw = Number(value || (now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()));
  if (!Number.isFinite(raw)) return now.getFullYear();
  return raw > 2400 ? raw - 543 : raw;
}

function resolveRange(searchParams: Record<string, string | string[] | undefined>): ReportRange {
  const now = new Date();
  const mode = typeof searchParams.mode === "string" ? searchParams.mode : "month";
  if (mode === "fiscalYear") {
    const fiscalYear = normalizeFiscalYear(typeof searchParams.fiscalYear === "string" ? searchParams.fiscalYear : undefined);
    return {
      start: new Date(fiscalYear - 1, 9, 1),
      end: new Date(fiscalYear, 9, 1),
      label: `ปีงบประมาณ ${fiscalYear + 543} (${fiscalYear - 1}-10 ถึง ${fiscalYear}-09)`,
      mode,
    };
  }
  if (mode === "range") {
    const start = parseMonth(typeof searchParams.startMonth === "string" ? searchParams.startMonth : undefined, now);
    const endBase = parseMonth(typeof searchParams.endMonth === "string" ? searchParams.endMonth : undefined, now);
    const end = new Date(endBase.getFullYear(), endBase.getMonth() + 1, 1);
    return { start, end: end < start ? new Date(start.getFullYear(), start.getMonth() + 1, 1) : end, label: `${start.toISOString().slice(0, 7)} ถึง ${endBase.toISOString().slice(0, 7)}`, mode };
  }
  const month = parseMonth(typeof searchParams.month === "string" ? searchParams.month : undefined, now);
  return { start: month, end: new Date(month.getFullYear(), month.getMonth() + 1, 1), label: month.toISOString().slice(0, 7), mode: "month" };
}

async function buildSummary(start: Date, end: Date, scopeUnitId?: string | null) {
  const incidents = await prisma.incident.findMany({
    where: { occurredAt: { gte: start, lt: end }, ...(scopeUnitId ? { incidentUnitId: scopeUnitId } : {}) },
    include: { incidentUnit: true, riskCode: true, rca: true, actionPlans: true },
    orderBy: [{ isSentinel: "desc" }, { severity: "desc" }, { occurredAt: "desc" }],
  });
  const topFromMap = (map: Map<string, number>, key: string) => Array.from(map.entries()).map(([name, count]) => ({ [key]: name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const countBy = (items: typeof incidents, label: (item: typeof incidents[number]) => string) => {
    const map = new Map<string, number>();
    for (const item of items) map.set(label(item), (map.get(label(item)) ?? 0) + 1);
    return map;
  };
  const unitScore = new Map<string, { unit: string; score: number; count: number }>();
  for (const item of incidents) {
    const current = unitScore.get(item.incidentUnit.name) ?? { unit: item.incidentUnit.name, score: 0, count: 0 };
    current.score += severityWeights[item.severity] ?? 0;
    current.count += 1;
    unitScore.set(item.incidentUnit.name, current);
  }
  return {
    total: incidents.length,
    closed: incidents.filter(item => item.status === "Closed").length,
    sentinel: incidents.filter(item => item.isSentinel).length,
    rcaNotStarted: incidents.filter(item => item.status === "RCARequired" && !item.rca).length,
    rcaSubmitted: incidents.filter(item => item.status === "RCASubmitted" || item.rca?.status === "Submitted").length,
    overdueActions: incidents.flatMap(item => item.actionPlans).filter(action => action.status !== "Verified" && action.dueDate < new Date()).length,
    sentinelEvents: incidents.filter(item => item.isSentinel).map(item => ({ incidentNo: item.incidentNo, unit: item.incidentUnit.name, severity: item.severity, riskCode: item.riskCode.code, title: item.title, status: item.status })),
    topUnitsByCount: topFromMap(countBy(incidents, item => item.incidentUnit.name), "unit"),
    topUnitsByScore: Array.from(unitScore.values()).sort((a, b) => b.score - a.score).slice(0, 5),
    topClinicalRisk: topFromMap(countBy(incidents.filter(item => item.clinicalOrGeneral === "Clinical"), item => `${item.riskCode.code} ${item.riskCode.nameTh}`), "riskCode"),
    topGeneralRisk: topFromMap(countBy(incidents.filter(item => item.clinicalOrGeneral === "General"), item => `${item.riskCode.code} ${item.riskCode.nameTh}`), "riskCode"),
    topSafetyGoals: safetyGoals.map(goal => ({ title: goal.title, count: incidents.filter(item => goal.codes.includes(item.riskCode.code)).length })).sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const now = new Date();
  const range = resolveRange(searchParams);
  const scopeUnitId = user.role === "UnitManager" ? user.unitId ?? "__NO_UNIT__" : undefined;
  const summary = await buildSummary(range.start, range.end, scopeUnitId);
  const currentMonth = range.mode === "month" ? range.start.toISOString().slice(0, 7) : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);
  const startMonth = range.mode === "range" ? range.start.toISOString().slice(0, 7) : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);
  const endMonth = range.mode === "range" ? new Date(range.end.getFullYear(), range.end.getMonth() - 1, 1).toISOString().slice(0, 7) : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7);
  const fiscalYear = range.end.getFullYear() + 543;
  return <AppShell user={user}><div className="print-page space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Summary Report</h1><p className="mt-2 text-slate-600">สรุปความเสี่ยงโรงพยาบาลแบบ printable ตามเดือน ช่วงเดือน หรือปีงบประมาณไทย</p></div><SavePdfButton /></div>
    <SummaryReportFilter defaults={{ mode: range.mode, month: currentMonth, startMonth, endMonth, fiscalYear: String(fiscalYear) }} />
    <div className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">Hospital Risk Summary Report</h2><p className="mt-1 text-sm text-slate-600">ช่วงเวลา: {range.label}</p>{user.role === "UnitManager" ? <p className="text-sm text-slate-600">ขอบเขต: เฉพาะหน่วยงานของคุณ</p> : null}<p className="text-sm text-slate-600">สร้างเมื่อ {new Date().toLocaleString("th-TH")}</p></div>
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"><Metric label="Incident ทั้งหมด" value={summary.total} /><Metric label="ปิดเคสแล้ว" value={summary.closed} /><Metric label="Sentinel" value={summary.sentinel} /><Metric label="RCA ยังไม่ทำ" value={summary.rcaNotStarted} /><Metric label="ส่ง RCA แล้ว" value={summary.rcaSubmitted} /><Metric label="Action overdue" value={summary.overdueActions} /></div>
    <Card className="border-red-200"><CardHeader><CardTitle>Sentinel alert</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.sentinelEvents} columns={["incidentNo", "unit", "severity", "riskCode", "title", "status"]} empty="ไม่มี sentinel event ในช่วงเวลานี้" /></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Top 5 หน่วยงานตามจำนวน incident</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topUnitsByCount} columns={["unit", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 หน่วยงานตาม weighted risk score</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topUnitsByScore} columns={["unit", "score", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 Clinical risk</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topClinicalRisk} columns={["riskCode", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 General risk</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topGeneralRisk} columns={["riskCode", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 in 9 Safety Goals</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topSafetyGoals} columns={["title", "count"]} /></CardContent></Card>
    </div>
  </div></AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{value}</CardContent></Card>;
}

function SimpleTable({ rows, columns, empty = "ไม่มีข้อมูล" }: { rows: any[]; columns: string[]; empty?: string }) {
  if (!rows.length) return <div className="text-sm text-slate-500">{empty}</div>;
  return <div className="overflow-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map(column => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column} className="break-words px-3 py-2">{String(row[column] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}
