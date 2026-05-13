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
  const query = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    const href = `${endpoints[variant]}${query ? `?${query}` : ""}`;
    fetch(href, { cache: "no-store", signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("DASHBOARD_CHARTS_FAILED")))
      .then((json) => setData(json?.data ?? json))
      .catch((err) => {
        if (err.name !== "AbortError") setError("โหลด chart ไม่สำเร็จ กรุณาลอง refresh หน้านี้อีกครั้ง");
      });
    return () => controller.abort();
  }, [query, variant]);

  if (error) return <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!data) return <DashboardChartsSkeleton />;
  return <DashboardChartPanels variant={variant} data={data} />;
}
