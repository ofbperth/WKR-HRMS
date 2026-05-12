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
    <div><h1 className="text-2xl font-bold">Heatmap Risk per Unit</h1><p className="text-sm text-slate-600">Toggle count/weighted score. Click cells to open filtered RM search.</p></div>
    <DashboardFilter units={dashboard.filters.units} categories={dashboard.filters.categories} />
    <div className="flex flex-wrap gap-2"><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode !== "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap">Severity view</a><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode === "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap?yMode=simpleCategory">SIMPLE category view</a></div>
    <HeatmapGrid data={heatmap} />
  </div></AppShell>;
}

