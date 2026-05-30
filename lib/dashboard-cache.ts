import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

type DashboardVariant = "rm" | "unit" | "executive";

export function buildDashboardCacheInput({
  variant,
  role,
  searchParams,
  scopeUnitId,
}: {
  variant: DashboardVariant;
  role: string;
  searchParams: Record<string, string | string[] | undefined>;
  scopeUnitId?: string | null;
}) {
  const filters = normalizeDashboardSearchParams(searchParams);
  const scopedFilters = scopeUnitId ? { ...filters, scopeUnitId } : filters;
  return {
    cacheType: "dashboard" as const,
    unitId: scopeUnitId ?? scopedFilters.unitId ?? null,
    dateRange: { from: scopedFilters.startDate ?? null, to: scopedFilters.endDate ?? null },
    reportType: `${variant}-dashboard`,
    role,
    filters: scopedFilters,
    scopedFilters,
  };
}
