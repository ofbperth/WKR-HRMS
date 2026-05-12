import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { CategoryPieChart, LinkedStatCard, RateLineChart, SentinelEventList, SeverityBarChart, TopRiskCodeBarChart, TrendLineChart } from "@/components/dashboard/charts";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export default async function RmDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardAnalytics(normalizeDashboardSearchParams(searchParams));
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">RM Dashboard</h1><p className="text-sm text-slate-600">Triage, RCA, action follow-up, and sentinel monitoring.</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <LinkedStatCard title="New incidents" value={data.cards.newIncidents} href="/rm/search?status=New" />
      <LinkedStatCard title="Under review" value={data.cards.underReview} href="/rm/search?status=UnderReview" />
      <LinkedStatCard title="RCA not started" value={data.cards.rcaRequired} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="RCA submitted" value={data.cards.rcaWaitingApproval} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="%RCA Submitted" value={`${data.cards.rcaSubmittedRate}%`} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="Action overdue" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="Need RM support" value={data.cards.needRmSupport} href="/rm/search?needRmSupport=true" />
      <LinkedStatCard title="Sentinel events" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="Waiting verification" value={data.cards.waitingVerification} href="/rm/search?status=WaitingVerification" />
    </div>
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,32rem),1fr))]">
      <SeverityBarChart title="Incident by status" data={data.charts.status} drilldown={{ basePath: "/rm/search", param: "status", field: "name" }} />
      <SeverityBarChart title="Incident by severity" data={data.charts.severity} drilldown={{ basePath: "/rm/search", param: "severity", field: "name" }} />
      <CategoryPieChart title="Clinical vs General risk" data={data.charts.clinicalGeneral} drilldown={{ basePath: "/rm/search", param: "clinicalOrGeneral", field: "name" }} />
      <TrendLineChart title="Trend Monthly Total incident" data={data.charts.trend} />
      <TopRiskCodeBarChart title="Incident by SIMPLE category" data={data.charts.simpleCategory} labelKey="category" drilldown={{ basePath: "/rm/search", param: "simpleCategory", field: "category" }} />
      <TopRiskCodeBarChart title="Top 5 Recurrent risk" data={data.charts.topRecurrentRiskCodes} drilldown={{ basePath: "/rm/search", param: "riskCodeId", field: "riskCodeId" }} />
      <CategoryPieChart title="RCA status distribution" data={data.charts.rcaStatus} />
      <CategoryPieChart title="Action status distribution" data={data.charts.actionStatus} />
      <TrendLineChart title="Monthly trend severity E-I" data={data.charts.trend} high />
      <RateLineChart title="Trend of %Rate near miss (Incident A-B/Total)" data={data.charts.trend} />
      <SentinelEventList title="Last 5 Sentinel event" data={data.charts.lastSentinelEvents} />
    </div>
  </div></AppShell>;
}
