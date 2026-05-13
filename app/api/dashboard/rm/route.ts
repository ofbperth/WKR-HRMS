import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
    const started = Date.now();
    const user = await requireUser(["RMTeam", "Admin"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const data = await getOrSetCachedValue({
      cacheType: "dashboard",
      unitId: null,
      dateRange: { from: params.startDate, to: params.endDate },
      reportType: "rm-dashboard",
      role: user.role,
      filters: params,
      loader: () => getDashboardAnalytics(params),
    });
    if (process.env.NODE_ENV === "development") console.info(`[perf] dashboard-api rm ${Date.now() - started}ms`);
    return Response.json({ data, meta: { cached: true } });
  } catch (error) {
    return apiError(error);
  }
}
