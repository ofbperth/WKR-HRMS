import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getSafetyGoalAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { SafetyGoalSummaryCard } from "@/components/dashboard/safety-goal-card";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";

export default async function ExecutiveSafetyGoalsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const [goals, dashboard] = await Promise.all([getSafetyGoalAnalytics(filters), getDashboardAnalytics(filters)]);
  const basePath = user.role === "RMTeam" || user.role === "Admin" ? "/rm/safety-goals" : "/executive/safety-goals";
  return <AppShell user={user}><div className="space-y-6"><div><h1 className="text-2xl font-bold">9 Important Safety Goals</h1><p className="text-sm text-slate-600">Compact overview cards. Open a card for detailed trend, RCA, actions, and related incidents.</p></div><DashboardFilter units={dashboard.filters.units} categories={dashboard.filters.categories} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{goals.map((goal, index) => <SafetyGoalSummaryCard key={goal.id} goal={{ ...goal, title: `${index + 1}. ${goal.title}` }} detailHref={`${basePath}/${goal.id}`} />)}</div></div></AppShell>;
}
