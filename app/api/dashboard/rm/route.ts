import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { buildDashboardCacheInput } from "@/lib/dashboard-cache";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["RMTeam", "Admin"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const cacheInput = buildDashboardCacheInput({ variant: "rm", role: user.role, searchParams: params });
    const data = await getOrSetCachedValue({
      ...cacheInput,
      loader: () => getDashboardAnalytics(cacheInput.scopedFilters),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api rm ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true } });
  } catch (error) {
    return apiError(error);
  }
}
