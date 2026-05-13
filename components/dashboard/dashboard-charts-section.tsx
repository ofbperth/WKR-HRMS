"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton";

type DashboardVariant = "rm" | "unit" | "executive";

const DashboardChartPanels = dynamic(
  () => import("@/components/dashboard/dashboard-chart-panels").then((mod) => mod.DashboardChartPanels),
  { loading: () => <DashboardChartsSkeleton />, ssr: false },
);

const endpoints: Record<DashboardVariant, string> = {
  rm: "/api/dashboard/rm",
  unit: "/api/dashboard/unit",
  executive: "/api/dashboard/executive",
};

export function DashboardChartsSection({ variant }: { variant: DashboardVariant }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const query = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const started = performance.now();
    setIsLoading(true);
    setError("");
    const href = `${endpoints[variant]}${query ? `?${query}` : ""}`;
    fetch(href, { cache: "no-store", signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("DASHBOARD_CHARTS_FAILED")))
      .then((json) => {
        setData(json?.data ?? json);
        if (process.env.NODE_ENV === "development") {
          console.info(`[perf] dashboard-charts ${variant} ${Math.round(performance.now() - started)}ms`);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("โหลดข้อมูล Dashboard ไม่สำเร็จ ลองอีกครั้ง");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [query, variant]);

  if (error && !data) return <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!data) return <DashboardChartsSkeleton />;
  return <div className="space-y-3">
    {isLoading ? <div className="inline-flex rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">กำลังโหลดข้อมูลใหม่...</div> : null}
    {error ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
    <DashboardChartPanels variant={variant} data={data} />
  </div>;
}
