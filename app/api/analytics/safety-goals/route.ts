import { apiError, requireUser } from "@/lib/auth";
import { getSafetyGoalAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin"]);
    const params = normalizeDashboardSearchParams(dashboardSearchParamsFromUrl(request.url));
    return Response.json(await getSafetyGoalAnalytics(params));
  } catch (error) {
    return apiError(error);
  }
}

