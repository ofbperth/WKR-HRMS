import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { HeatmapGrid } from "@/components/dashboard/heatmap-grid";
import { getHeatmapAnalytics } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { getLookupData } from "@/lib/incident-query";

export default async function HeatmapPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = normalizeDashboardSearchParams(searchParams);
  const lookup = await getLookupData();
  const heatmap = await getHeatmapAnalytics(filters);

  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Heatmap ความเสี่ยงต่อหน่วยงาน</h1><p className="text-sm text-slate-600">สลับมุมมองจำนวน/คะแนนถ่วงน้ำหนัก และคลิกช่องข้อมูลเพื่อเปิดผลค้นหา RM ที่กรองไว้</p></div>
    <DashboardFilter units={lookup.units} categories={lookup.simpleCategories} />
    <div className="flex flex-wrap gap-2">
      <a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode !== "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href={heatmapModeHref(searchParams, "")}>มุมมองระดับความรุนแรง</a>
      <a className={`rounded-md border px-3 py-2 text-sm ${searchParams.yMode === "simpleCategory" ? "bg-primary text-white" : "bg-white"}`} href={heatmapModeHref(searchParams, "simpleCategory")}>มุมมองหมวด SIMPLE</a>
    </div>
    <HeatmapGrid data={heatmap} />
  </div></AppShell>;
}

function heatmapModeHref(searchParams: Record<string, string | string[] | undefined>, yMode: string) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "yMode") return;
    if (typeof value === "string" && value) query.set(key, value);
    if (Array.isArray(value)) value.filter(Boolean).forEach((item) => query.append(key, item));
  });
  if (yMode) query.set("yMode", yMode);
  const suffix = query.toString();
  return suffix ? `/rm/heatmap?${suffix}` : "/rm/heatmap";
}
