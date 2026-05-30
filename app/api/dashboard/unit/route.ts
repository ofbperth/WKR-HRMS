import { apiError, requireUser } from "@/lib/auth";
import { dashboardAnalyticsCacheVersion, getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["UnitManager", "Admin"]);
    const rawParams = dashboardSearchParamsFromUrl(request.url);
    const params = normalizeDashboardSearchParams(rawParams);
    const scopeUnitId = user.role === "Admin" ? params.unitId : user.unitId;
    const filters = { ...params, scopeUnitId };
    const data = await getOrSetCachedValue({
      cacheType: "dashboard",
      unitId: scopeUnitId,
      dateRange: { from: params.startDate, to: params.endDate },
      reportType: "unit-dashboard",
      role: user.role,
      filters: { ...filters, cacheVersion: dashboardAnalyticsCacheVersion },
      loader: () => getDashboardAnalytics(filters),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api unit ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true, scopeUnitId } });
  } catch (error) {
    return apiError(error);
  }
}
