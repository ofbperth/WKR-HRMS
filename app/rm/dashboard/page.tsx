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
    <div><h1 className="text-2xl font-bold">RM Dashboard</h1><p className="text-sm text-slate-600">ติดตาม Triage, RCA, action follow-up และ Sentinel monitoring</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="Incident ใหม่" value={data.cards.newIncidents} href="/rm/search?status=New" />
      <LinkedStatCard title="อยู่ระหว่าง Review" value={data.cards.underReview} href="/rm/search?status=UnderReview" />
      <LinkedStatCard title="ยังไม่เริ่ม RCA" value={data.cards.rcaRequired} href="/rm/search?status=RCARequired" />
      <LinkedStatCard title="ส่ง RCA แล้ว" value={data.cards.rcaWaitingApproval} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="%RCA Submitted" value={`${data.cards.rcaSubmittedRate}%`} href="/rm/search?status=RCASubmitted" />
      <LinkedStatCard title="Action overdue" value={data.cards.overdueActions} href="/rm/search?status=ActionOngoing" />
      <LinkedStatCard title="ต้องการ RM support" value={data.cards.needRmSupport} href="/rm/search?needRmSupport=true" />
      <LinkedStatCard title="Sentinel event" value={data.cards.sentinel} href="/rm/search?sentinel=true" />
      <LinkedStatCard title="รอ verification" value={data.cards.waitingVerification} href="/rm/search?status=WaitingVerification" />
    </div>
    <div className="dashboard-chart-grid">
      <SeverityBarChart title="Incident ตาม status" data={data.charts.status} drilldown={{ basePath: "/rm/search", param: "status", field: "name" }} />
      <SeverityBarChart title="Incident ตาม severity" data={data.charts.severity} drilldown={{ basePath: "/rm/search", param: "severity", field: "name" }} />
      <CategoryPieChart title="Clinical vs General risk" data={data.charts.clinicalGeneral} drilldown={{ basePath: "/rm/search", param: "clinicalOrGeneral", field: "name" }} />
      <TrendLineChart title="Trend incident รายเดือน" data={data.charts.trend} />
      <TopRiskCodeBarChart title="Incident ตาม SIMPLE category" data={data.charts.simpleCategory} labelKey="category" drilldown={{ basePath: "/rm/search", param: "simpleCategory", field: "category" }} />
      <TopRiskCodeBarChart title="Top 5 risk ที่เกิดซ้ำ" data={data.charts.topRecurrentRiskCodes} drilldown={{ basePath: "/rm/search", param: "riskCodeId", field: "riskCodeId" }} />
      <CategoryPieChart title="สัดส่วน status ของ RCA" data={data.charts.rcaStatus} />
      <CategoryPieChart title="สัดส่วน status ของ Action" data={data.charts.actionStatus} />
      <TrendLineChart title="Trend severity E-I รายเดือน" data={data.charts.trend} high />
      <RateLineChart title="Trend %Rate near miss (Incident A-B/Total)" data={data.charts.trend} />
      <SentinelEventList title="Sentinel event 5 รายการล่าสุด" data={data.charts.lastSentinelEvents} />
    </div>
  </div></AppShell>;
}
