import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardSummarySkeleton, UnitDashboardSummary } from "@/components/dashboard/dashboard-summary-sections";

export default async function UnitDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Unit Dashboard</h1><p className="text-sm text-slate-600">Incident, RCA และ action status เฉพาะหน่วยงานของคุณ</p></div>
    <Suspense fallback={<DashboardSummarySkeleton cards={8} />}>
      <UnitDashboardSummary searchParams={searchParams} unitId={user.unitId} />
    </Suspense>
  </div></AppShell>;
}
