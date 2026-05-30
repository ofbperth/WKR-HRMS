import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { buildDashboardCacheInput } from "@/lib/dashboard-cache";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["UnitManager", "Admin"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const scopeUnitId = user.role === "Admin" ? params.unitId : user.unitId;
    const cacheInput = buildDashboardCacheInput({ variant: "unit", role: user.role, searchParams: params, scopeUnitId });
    const data = await getOrSetCachedValue({
      ...cacheInput,
      loader: () => getDashboardAnalytics(cacheInput.scopedFilters),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api unit ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true, scopeUnitId } });
  } catch (error) {
    return apiError(error);
  }
}
