import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { HeatmapGrid } from "@/components/dashboard/heatmap-grid";
import { getDashboardAnalytics, getHeatmapAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export default async function HeatmapPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const [dashboard, heatmap] = await Promise.all([getDashboardAnalytics(filters), getHeatmapAnalytics({ ...filters, simpleCategory: searchParams.yMode === "simpleCategory" ? "__Y_SIMPLE__" : filters.simpleCategory })]);
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Heatmap Risk ต่อหน่วยงาน</h1><p className="text-sm text-slate-600">สลับมุมมอง count/weighted score และคลิก cell เพื่อเปิดผลค้นหา RM ที่กรองไว้</p></div>
    <DashboardFilter units={dashboard.filters.units} categories={dashboard.filters.categories} />
    <div className="flex flex-wrap gap-2"><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode !== "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap">มุมมอง Severity</a><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode === "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap?yMode=simpleCategory">มุมมอง SIMPLE category</a></div>
    <HeatmapGrid data={heatmap} />
  </div></AppShell>;
}

