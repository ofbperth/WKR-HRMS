import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export const preferredRegion = "sin1";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin", "UnitManager"]);
    const params = normalizeDashboardSearchParams(dashboardSearchParamsFromUrl(request.url));
    const data = await getDashboardAnalytics(params);
    return Response.json(data.charts.topRiskCodes);
  } catch (error) {
    return apiError(error);
  }
}

