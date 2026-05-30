import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardSummarySkeleton, ExecutiveDashboardSummary } from "@/components/dashboard/dashboard-summary-sections";

export default async function ExecutiveDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Dashboard ผู้บริหาร</h1><p className="text-sm text-slate-600">ภาพรวมตัวชี้วัดความเสี่ยง โดยปกปิดข้อมูลละเอียดอ่อน</p></div>
    <Suspense fallback={<DashboardSummarySkeleton cards={8} />}>
      <ExecutiveDashboardSummary searchParams={searchParams} role={user.role} />
    </Suspense>
  </div></AppShell>;
}
