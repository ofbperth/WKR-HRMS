import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { dashboardSearchParamsFromUrl, normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

export const preferredRegion = "sin1";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Executive", "RMTeam", "Admin", "UnitManager"]);
    const params = normalizeDashboardSearchParams(dashboardSearchParamsFromUrl(request.url));
    if (user.role === "UnitManager") {
      if (!user.unitId) return Response.json({ error: "USER_UNIT_REQUIRED" }, { status: 428 });
      params.scopeUnitId = user.unitId;
    }
    const data = await getDashboardAnalytics(params);
    return Response.json(data.charts.topRiskCodes);
  } catch (error) {
    return apiError(error);
  }
}

