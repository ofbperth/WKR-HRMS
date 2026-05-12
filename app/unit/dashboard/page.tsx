import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { CategoryPieChart, LinkedStatCard, SeverityBarChart, TopRiskCodeBarChart, TrendLineChart } from "@/components/dashboard/charts";
import { getDashboardAnalytics, getFiscalYearRange, getThisMonthRange } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeHref(basePath: string, range: { start: Date; end: Date }) {
  return `${basePath}?from=${dateOnly(range.start)}&to=${dateOnly(range.end)}`;
}

export default async function UnitDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardAnalytics({ ...normalizeDashboardSearchParams(searchParams), scopeUnitId: user.unitId });
  const basePath = "/unit/incidents";
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Unit Dashboard</h1><p className="text-sm text-slate-600">Incidents, RCA, and action status for your unit only.</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} showUnit={false} />
    <div className="grid gap-4 md:grid-cols-4">
      <LinkedStatCard title="This month" value={data.cards.totalThisMonth} href={rangeHref(basePath, getThisMonthRange())} />
      <LinkedStatCard title="Fiscal year" value={data.cards.totalFiscalYear} href={rangeHref(basePath, getFiscalYearRange())} />
      <LinkedStatCard title="Open RCA" value={data.cards.openRca} href={`${basePath}?status=RCARequired`} />
      <LinkedStatCard title="RCA revision" value={data.cards.rcaRevisionRequired} href="/unit/rca" />
      <LinkedStatCard title="Open actions" value={data.cards.openActions} href="/unit/actions" />
      <LinkedStatCard title="Overdue actions" value={data.cards.overdueActions} href="/unit/actions" />
      <LinkedStatCard title="Highest severity" value={data.cards.highestSeverity || "-"} href={`${basePath}?severity=${data.cards.highestSeverityLabel || ""}`} />
      <LinkedStatCard title="Closed case rate" value={`${data.cards.closedCaseRate}%`} href={`${basePath}?status=Closed`} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <TrendLineChart title="Unit incident trend by month" data={data.charts.trend} />
      <SeverityBarChart title="Unit severity distribution" data={data.charts.severity} drilldown={{ basePath, param: "severity", field: "name" }} />
      <TopRiskCodeBarChart title="Unit top risk codes" data={data.charts.topRiskCodes} drilldown={{ basePath, param: "riskCodeId", field: "riskCodeId" }} />
      <CategoryPieChart title="Unit action status" data={data.charts.actionStatus} />
      <CategoryPieChart title="Unit RCA status" data={data.charts.rcaStatus} />
    </div>
  </div></AppShell>;
}
