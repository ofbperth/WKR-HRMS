import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { LinkedStatCard } from "@/components/dashboard/stat-cards";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { getDashboardSummary } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export default async function RmDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardSummary(normalizeDashboardSearchParams(searchParams));
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
    <DashboardChartsSection variant="rm" />
  </div></AppShell>;
}
