import { apiError, requireUser } from "@/lib/auth";
import { getHeatmapAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export const preferredRegion = "sin1";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin"]);
    const params = normalizeDashboardSearchParams(dashboardSearchParamsFromUrl(request.url));
    return Response.json(await getHeatmapAnalytics(params));
  } catch (error) {
    return apiError(error);
  }
}

