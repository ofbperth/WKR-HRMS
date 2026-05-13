import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getSafetyGoalAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { SafetyGoalCard } from "@/components/dashboard/safety-goal-card";
import { getLookupData } from "@/lib/incident-query";

export default async function SafetyGoalDetailPage({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const lookup = await getLookupData();
  const goals = await getSafetyGoalAnalytics(filters);
  const index = goals.findIndex(goal => goal.id === params.id);
  const goal = goals[index];
  if (!goal) notFound();
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">{index + 1}. {goal.title}</h1><p className="text-sm text-slate-600">Detailed safety goal trend, RCA, overdue action, and related risk code summary.</p></div>
    <DashboardFilter units={lookup.units} categories={lookup.simpleCategories} />
    <SafetyGoalCard goal={goal} />
  </div></AppShell>;
}
