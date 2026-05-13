import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getSafetyGoalAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { SafetyGoalSummaryCard } from "@/components/dashboard/safety-goal-card";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { getLookupData } from "@/lib/incident-query";

export default async function ExecutiveSafetyGoalsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const lookup = await getLookupData();
  const goals = await getSafetyGoalAnalytics(filters);
  const basePath = user.role === "RMTeam" || user.role === "Admin" ? "/rm/safety-goals" : "/executive/safety-goals";
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">9 Important Safety Goals</h1><p className="text-sm text-slate-600">การ์ดสรุปแบบ compact เปิดดู detail trend, RCA, action และ incident ที่เกี่ยวข้องได้</p></div>
    <DashboardFilter units={lookup.units} categories={lookup.simpleCategories} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{goals.map((goal, index) => <SafetyGoalSummaryCard key={goal.id} goal={{ ...goal, title: `${index + 1}. ${goal.title}` }} detailHref={`${basePath}/${goal.id}`} />)}</div>
  </div></AppShell>;
}
