import { apiError, requireUser } from "@/lib/auth";
import { getSafetyGoalAnalytics } from "@/lib/dashboard-analytics";

export async function GET(request: Request) {
  try {
    await requireUser(["Executive", "RMTeam", "Admin"]);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    return Response.json(await getSafetyGoalAnalytics(params));
  } catch (error) {
    return apiError(error);
  }
}

