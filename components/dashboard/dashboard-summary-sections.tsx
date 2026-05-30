import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { LinkedStatCard } from "@/components/dashboard/stat-cards";
import { getDashboardSummary, getFiscalYearRange, getThisMonthRange } from "@/lib/dashboard-analytics";
import { getOrSetCachedValue } from "@/lib/smart-cache";
import { buildDashboardCacheInput } from "@/lib/dashboard-cache";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeHref(basePath: string, range: { start: Date; end: Date }) {
  return `${basePath}?from=${dateOnly(range.start)}&to=${dateOnly(range.end)}`;
}

function logDashboardLoad(label: string, started: number) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] dashboard-data ${label} ${Date.now() - started}ms`);
  }
}

export function DashboardSummarySkeleton({ cards = 8 }: { cards?: number }) {
  return <div className="space-y-6">
    <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
    <div className="dashboard-stat-grid">
      {Array.from({ length: cards }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border bg-white" />)}
    </div>
    <DashboardChartsSkeleton />
  </div>;
}

export async function RmDashboardSummary({ searchParams, role }: { searchParams: DashboardSearchParams; role: string }) {
  const started = Date.now();
  const cacheInput = buildDashboardCacheInput({ variant: "rm", role, searchParams });
  const data = await getOrSetCachedValue({
    ...cacheInput,
    loader: () => getDashboardSummary(cacheInput.scopedFilters),
  });
  logDashboardLoad("rm", started);
  return <div className="space-y-6">
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="Incident ใหม่" value={data.cards.newIncidents} href="/rm/search?status=New" />
      <LinkedStatCard title="อยู่ระหว่าง Review" value={data.cards.underReview} href="/rm/search?status=UnderReview" />
      <LinkedStatCard title="ยังไม่เริ่ม RCA" value={data.cards.rcaRequired} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="ส่ง RCA แล้ว" value={data.cards.rcaWaitingApproval} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="%RCA Submitted" value={`${data.cards.rcaSubmittedRate}%`} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="RCA เกินกำหนด" value={data.cards.overdueRca} href="/rm/search?rcaDue=overdue" caption="ยังไม่ส่ง RCA และเลยวันกำหนดส่ง" />
      <LinkedStatCard title="แผนแก้ไขเกินกำหนด" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="ต้องการ RM support" value={data.cards.needRmSupport} href="/rm/search?needRmSupport=true" />
      <LinkedStatCard title="Sentinel event" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="รอ verification" value={data.cards.waitingVerification} href="/rm/search?status=WaitingVerification" />
    </div>
    <DashboardChartsSection variant="rm" />
  </div>;
}

export async function UnitDashboardSummary({ searchParams, unitId, role }: { searchParams: DashboardSearchParams; unitId: string | null; role: string }) {
  const started = Date.now();
  const cacheInput = buildDashboardCacheInput({ variant: "unit", role, searchParams, scopeUnitId: unitId });
  const data = await getOrSetCachedValue({
    ...cacheInput,
    loader: () => getDashboardSummary(cacheInput.scopedFilters),
  });
  logDashboardLoad("unit", started);
  const basePath = "/unit/incidents";
  return <div className="space-y-6">
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} showUnit={false} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="เดือนนี้" value={data.cards.totalThisMonth} href={rangeHref(basePath, getThisMonthRange())} />
      <LinkedStatCard title="ปีงบประมาณ" value={data.cards.totalFiscalYear} href={rangeHref(basePath, getFiscalYearRange())} />
      <LinkedStatCard title="RCA ที่เปิดอยู่" value={data.cards.openRca} href={`${basePath}?status=RCARequired`} />
      <LinkedStatCard title="RCA revision" value={data.cards.rcaRevisionRequired} href="/unit/rca" />
      <LinkedStatCard title="Action ที่เปิดอยู่" value={data.cards.openActions} href="/unit/actions" />
      <LinkedStatCard title="แผนแก้ไขเกินกำหนด" value={data.cards.overdueActions} href="/unit/actions" />
      <LinkedStatCard title="Severity สูงสุด" value={data.cards.highestSeverity || "-"} href={`${basePath}?severity=${data.cards.highestSeverityLabel || ""}`} />
      <LinkedStatCard title="อัตราปิดเคส" value={`${data.cards.closedCaseRate}%`} href={`${basePath}?status=Closed`} />
    </div>
    <DashboardChartsSection variant="unit" />
  </div>;
}

export async function ExecutiveDashboardSummary({ searchParams, role }: { searchParams: DashboardSearchParams; role: string }) {
  const started = Date.now();
  const cacheInput = buildDashboardCacheInput({ variant: "executive", role, searchParams });
  const data = await getOrSetCachedValue({
    ...cacheInput,
    loader: () => getDashboardSummary(cacheInput.scopedFilters),
  });
  logDashboardLoad("executive", started);
  return <div className="space-y-6">
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="เดือนนี้" value={data.cards.totalThisMonth} href={rangeHref("/rm/search", getThisMonthRange())} />
      <LinkedStatCard title="ปีงบประมาณ" value={data.cards.totalFiscalYear} href={rangeHref("/rm/search", getFiscalYearRange())} />
      <LinkedStatCard title="Sentinel event" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="RCA ที่เปิดอยู่" value={data.cards.openRca} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="แผนแก้ไขเกินกำหนด" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="อัตราปิดเคส" value={`${data.cards.closedCaseRate}%`} href="/rm/search?status=Closed" />
      <LinkedStatCard title="ต้องตัดสินใจระดับบริหาร" value={data.cards.needLeadershipDecision} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="Severity E-I" value={data.cards.highSeverity} href="/rm/search?severity=E" />
    </div>
    <DashboardChartsSection variant="executive" />
  </div>;
}
