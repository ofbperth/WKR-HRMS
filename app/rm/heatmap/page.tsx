import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { HeatmapGrid } from "@/components/dashboard/heatmap-grid";
import { getHeatmapAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { getDashboardFilterLookups } from "@/lib/incident-query";

export default async function HeatmapPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const lookup = await getDashboardFilterLookups();
  const heatmap = await getHeatmapAnalytics({ ...filters, simpleCategory: searchParams.yMode === "simpleCategory" ? "__Y_SIMPLE__" : filters.simpleCategory });
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Heatmap ความเสี่ยงต่อหน่วยงาน</h1><p className="text-sm text-slate-600">สลับมุมมองจำนวน/คะแนนถ่วงน้ำหนัก และคลิกช่องข้อมูลเพื่อเปิดผลค้นหา RM ที่กรองไว้</p></div>
    <DashboardFilter units={lookup.units} categories={lookup.simpleCategories} />
    <div className="flex flex-wrap gap-2"><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode !== "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap">มุมมองระดับความรุนแรง</a><a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode === "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href="/rm/heatmap?yMode=simpleCategory">มุมมองหมวด SIMPLE</a></div>
    <HeatmapGrid data={heatmap} />
  </div></AppShell>;
}
