import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardSummarySkeleton, RmDashboardSummary } from "@/components/dashboard/dashboard-summary-sections";

export default async function RmDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">RM Dashboard</h1><p className="text-sm text-slate-600">ติดตาม Triage, RCA, action follow-up และ Sentinel monitoring</p></div>
    <Suspense fallback={<DashboardSummarySkeleton cards={10} />}>
      <RmDashboardSummary searchParams={searchParams} />
    </Suspense>
  </div></AppShell>;
}
