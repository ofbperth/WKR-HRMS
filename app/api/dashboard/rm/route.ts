import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { getOrSetCachedValue } from "@/lib/smart-cache";

export async function GET(request: Request) {
  try {
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
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
