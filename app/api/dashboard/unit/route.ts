import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["UnitManager", "Admin"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const scopeUnitId = user.role === "Admin" ? params.unitId : user.unitId;
    const filters = { ...params, scopeUnitId };
    const data = await getOrSetCachedValue({
      cacheType: "dashboard",
      unitId: scopeUnitId,
      dateRange: { from: params.startDate, to: params.endDate },
      reportType: "unit-dashboard",
      role: user.role,
      filters,
      loader: () => getDashboardAnalytics(filters),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api unit ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true, scopeUnitId } });
  } catch (error) {
    return apiError(error);
  }
}
