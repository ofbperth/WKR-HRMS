import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { LinkedStatCard } from "@/components/dashboard/stat-cards";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { getDashboardSummary, getFiscalYearRange, getThisMonthRange } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeHref(range: { start: Date; end: Date }) {
  return `/rm/search?from=${dateOnly(range.start)}&to=${dateOnly(range.end)}`;
}

export default async function ExecutiveDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardSummary(normalizeDashboardSearchParams(searchParams));
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Executive Dashboard</h1><p className="text-sm text-slate-600">ภาพรวมตัวชี้วัดความเสี่ยง โดยปกปิดข้อมูล sensitive</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="เดือนนี้" value={data.cards.totalThisMonth} href={rangeHref(getThisMonthRange())} />
      <LinkedStatCard title="ปีงบประมาณ" value={data.cards.totalFiscalYear} href={rangeHref(getFiscalYearRange())} />
      <LinkedStatCard title="Sentinel event" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="RCA ที่เปิดอยู่" value={data.cards.openRca} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="Action overdue" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="อัตราปิดเคส" value={`${data.cards.closedCaseRate}%`} href="/rm/search?status=Closed" />
      <LinkedStatCard title="ต้องตัดสินใจระดับบริหาร" value={data.cards.needLeadershipDecision} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="Severity E-I" value={data.cards.highSeverity} href="/rm/search?severity=E" />
    </div>
    <DashboardChartsSection variant="executive" />
  </div></AppShell>;
}
