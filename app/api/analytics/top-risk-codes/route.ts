import { apiError, requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin", "UnitManager"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const data = await getDashboardAnalytics(params);
    return Response.json(data.charts.topRiskCodes);
  } catch (error) {
    return apiError(error);
  }
}

