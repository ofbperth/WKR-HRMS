import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavePdfButton } from "@/components/reports/save-pdf-button";
import { SummaryReportFilter } from "@/components/reports/summary-report-filter";
import { safetyGoals } from "@/lib/dashboard-analytics";
import { formatDateOnly, formatDateTime, formatMonthBucket } from "@/lib/format";
import { bangkokMonthInputToRange, bangkokMonthKey, bangkokMonthRange } from "@/lib/reporting-date";
import { severityWeights } from "@/lib/severity";
import { countableIncidentFilter } from "@/lib/prisma-fields";

type ReportRange = { start: Date; end: Date; label: string; mode: string; fiscalYear?: number };

function parseMonth(value: string | undefined, fallback: Date) {
  return bangkokMonthInputToRange(value, fallback);
}

function normalizeFiscalYear(value: string | undefined) {
  const now = new Date();
  const [currentYear, currentMonth] = bangkokMonthKey(now).split("-").map(Number);
  const raw = Number(value || (currentMonth >= 10 ? currentYear + 1 : currentYear));
  if (!Number.isFinite(raw)) return currentYear;
  return raw > 2400 ? raw - 543 : raw;
}

function resolveRange(searchParams: Record<string, string | string[] | undefined>): ReportRange {
  const now = new Date();
  const mode = typeof searchParams.mode === "string" ? searchParams.mode : "month";
  if (mode === "fiscalYear") {
    const fiscalYear = normalizeFiscalYear(typeof searchParams.fiscalYear === "string" ? searchParams.fiscalYear : undefined);
    return {
      start: bangkokMonthRange(fiscalYear - 1, 10).start,
      end: bangkokMonthRange(fiscalYear, 9).end,
      label: `ปีงบประมาณ ${fiscalYear + 543} (${formatDateOnly(bangkokMonthRange(fiscalYear - 1, 10).start)} ถึง ${formatDateOnly(bangkokMonthRange(fiscalYear, 9).end)})`,
      mode,
      fiscalYear,
    };
  }
  if (mode === "range") {
    const start = parseMonth(typeof searchParams.startMonth === "string" ? searchParams.startMonth : undefined, now);
    const endBase = parseMonth(typeof searchParams.endMonth === "string" ? searchParams.endMonth : undefined, now);
    const end = endBase.start < start.start ? start.end : endBase.end;
    const endLabel = endBase.start < start.start ? bangkokMonthKey(start.start) : bangkokMonthKey(endBase.start);
    return { start: start.start, end, label: `${formatMonthBucket(bangkokMonthKey(start.start))} ถึง ${formatMonthBucket(endLabel)}`, mode };
  }
  const month = parseMonth(typeof searchParams.month === "string" ? searchParams.month : undefined, now);
  return { start: month.start, end: month.end, label: formatMonthBucket(bangkokMonthKey(month.start)), mode: "month" };
}

async function buildSummary(start: Date, end: Date, scopeUnitId?: string | null) {
  const incidents = await prisma.incident.findMany({
    where: countableIncidentFilter({ occurredAt: { gte: start, lte: end }, ...(scopeUnitId ? { incidentUnitId: scopeUnitId } : {}) }),
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
  const currentBangkokMonth = bangkokMonthKey(now);
  const currentMonth = range.mode === "month" ? bangkokMonthKey(range.start) : currentBangkokMonth;
  const startMonth = range.mode === "range" ? bangkokMonthKey(range.start) : currentBangkokMonth;
  const endMonth = range.mode === "range" ? bangkokMonthKey(range.end) : currentBangkokMonth;
  const fiscalYear = (range.fiscalYear ?? normalizeFiscalYear(undefined)) + 543;
  return <AppShell user={user}><div className="print-page space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">รายงานสรุปความเสี่ยง</h1><p className="mt-2 text-slate-600">สรุปความเสี่ยงโรงพยาบาลสำหรับพิมพ์ ตามเดือน ช่วงเดือน หรือปีงบประมาณไทย</p></div><SavePdfButton /></div>
    <SummaryReportFilter defaults={{ mode: range.mode, month: currentMonth, startMonth, endMonth, fiscalYear: String(fiscalYear) }} />
    <div className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">รายงานสรุปความเสี่ยงโรงพยาบาล</h2><p className="mt-1 text-sm text-slate-600">ช่วงเวลา: {range.label}</p>{user.role === "UnitManager" ? <p className="text-sm text-slate-600">ขอบเขต: เฉพาะหน่วยงานของคุณ</p> : null}<p className="text-sm text-slate-600">สร้างเมื่อ {formatDateTime(new Date())}</p></div>
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"><Metric label="Incident ทั้งหมด" value={summary.total} /><Metric label="ปิดเคสแล้ว" value={summary.closed} /><Metric label="Sentinel" value={summary.sentinel} /><Metric label="RCA ยังไม่ทำ" value={summary.rcaNotStarted} /><Metric label="ส่ง RCA แล้ว" value={summary.rcaSubmitted} /><Metric label="แผนแก้ไขเกินกำหนด" value={summary.overdueActions} /></div>
    <Card className="border-red-200"><CardHeader><CardTitle>แจ้งเตือน Sentinel Event</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.sentinelEvents} columns={["incidentNo", "unit", "severity", "riskCode", "title", "status"]} empty="ไม่มี Sentinel Event ในช่วงเวลานี้" /></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Top 5 หน่วยงานตามจำนวนอุบัติการณ์</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topUnitsByCount} columns={["unit", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 หน่วยงานตามคะแนนความเสี่ยงถ่วงน้ำหนัก</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topUnitsByScore} columns={["unit", "score", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 ความเสี่ยงเกี่ยวกับการดูแลรักษาผู้ป่วย</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topClinicalRisk} columns={["riskCode", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 ความเสี่ยงทั่วไป / ระบบงาน / สิ่งแวดล้อม</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topGeneralRisk} columns={["riskCode", "count"]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top 5 ใน 9 มาตรฐานสำคัญ</CardTitle></CardHeader><CardContent><SimpleTable rows={summary.topSafetyGoals} columns={["title", "count"]} /></CardContent></Card>
    </div>
  </div></AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{value}</CardContent></Card>;
}

function SimpleTable({ rows, columns, empty = "ไม่มีข้อมูล" }: { rows: any[]; columns: string[]; empty?: string }) {
  if (!rows.length) return <div className="text-sm text-slate-500">{empty}</div>;
  return <div className="max-w-full overflow-hidden"><table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map(column => <th key={column} className="break-words px-2 py-2">{columnLabel(column)}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column} className="break-words px-2 py-2 align-top">{String(row[column] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}

function columnLabel(column: string) {
  const labels: Record<string, string> = {
    count: "จำนวน",
    incidentNo: "เลขที่รายงาน",
    riskCode: "รหัสความเสี่ยง",
    score: "คะแนน",
    severity: "ระดับความรุนแรง",
    status: "สถานะ",
    title: "ชื่อเหตุการณ์",
    unit: "หน่วยงาน",
  };
  return labels[column] ?? column;
}
