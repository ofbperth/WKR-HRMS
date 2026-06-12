import { apiError, requireUser } from "@/lib/auth";
import { createRiskForUser, getRiskListForUser } from "@/lib/risk-register";
import { riskCreateSchema } from "@/lib/validators";

function parseFilters(request: Request) {
  const url = new URL(request.url);
  return {
    scope: url.searchParams.get("scope") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    ownerUnitId: url.searchParams.get("ownerUnitId") ?? undefined,
    ownerTeamId: url.searchParams.get("ownerTeamId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    riskType: url.searchParams.get("riskType") ?? undefined,
    trend: url.searchParams.get("trend") ?? undefined,
    decisionRequired: url.searchParams.get("decisionRequired") ?? undefined,
    dueReview: url.searchParams.get("dueReview") ?? undefined,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Executive", "Admin"]);
    return Response.json(await getRiskListForUser(user, parseFilters(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = riskCreateSchema.parse(await request.json());
    const created = await createRiskForUser(user, input);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
