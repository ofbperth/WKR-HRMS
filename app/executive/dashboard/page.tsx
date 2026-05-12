import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { CategoryPieChart, LinkedStatCard, SeverityBarChart, TopRiskCodeBarChart, TrendLineChart, UnitRankingChart } from "@/components/dashboard/charts";
import { getDashboardAnalytics, getFiscalYearRange, getThisMonthRange } from "@/lib/dashboard-analytics";
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
  const data = await getDashboardAnalytics(normalizeDashboardSearchParams(searchParams));
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Executive Dashboard</h1><p className="text-sm text-slate-600">Summary view with masked-sensitive operational risk indicators.</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="This month" value={data.cards.totalThisMonth} href={rangeHref(getThisMonthRange())} />
      <LinkedStatCard title="Fiscal year" value={data.cards.totalFiscalYear} href={rangeHref(getFiscalYearRange())} />
      <LinkedStatCard title="Sentinel events" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="Open RCA" value={data.cards.openRca} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="Overdue actions" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="Closed case rate" value={`${data.cards.closedCaseRate}%`} href="/rm/search?status=Closed" />
      <LinkedStatCard title="Leadership decision" value={data.cards.needLeadershipDecision} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="Severity E-I" value={data.cards.highSeverity} href="/rm/search?severity=E" />
    </div>
    <div className="dashboard-chart-grid"><TrendLineChart title="Incident trend by month" data={data.charts.trend} /><SeverityBarChart title="Severity distribution A-I" data={data.charts.severity} drilldown={{ basePath: "/rm/search", param: "severity", field: "name" }} /><CategoryPieChart title="Clinical vs General" data={data.charts.clinicalGeneral} drilldown={{ basePath: "/rm/search", param: "clinicalOrGeneral", field: "name" }} /><TopRiskCodeBarChart title="Top 10 risk codes" data={data.charts.topRiskCodes} drilldown={{ basePath: "/rm/search", param: "riskCodeId", field: "riskCodeId" }} /><UnitRankingChart title="Top 10 units by incident count" data={data.charts.topUnits} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} /><UnitRankingChart title="Top 10 units by weighted risk score" data={data.charts.weightedUnits} score drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} /><UnitRankingChart title="Open RCA by unit" data={data.charts.openRcaByUnit} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} /><UnitRankingChart title="Overdue action by unit" data={data.charts.overdueActionByUnit} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} /></div>
  </div></AppShell>;
}
