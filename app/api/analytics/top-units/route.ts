import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin"]);
    const params = normalizeDashboardSearchParams(dashboardSearchParamsFromUrl(request.url));
    const data = await getDashboardAnalytics(params);
    return Response.json(data.charts.topUnits);
  } catch (error) {
    return apiError(error);
  }
}

