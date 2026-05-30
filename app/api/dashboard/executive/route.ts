import { apiError, requireUser } from "@/lib/auth";
import { dashboardAnalyticsCacheVersion, getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["Executive", "RMTeam", "Admin"]);
    const rawParams = dashboardSearchParamsFromUrl(request.url);
    const params = normalizeDashboardSearchParams(rawParams);
    const data = await getOrSetCachedValue({
      cacheType: "dashboard",
      unitId: params.unitId,
      dateRange: { from: params.startDate, to: params.endDate },
      reportType: "executive-dashboard",
      role: user.role,
      filters: { ...params, cacheVersion: dashboardAnalyticsCacheVersion },
      loader: () => getDashboardAnalytics(params),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api executive ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true } });
  } catch (error) {
    return apiError(error);
  }
}
