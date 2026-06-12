import { apiError, requireUser } from "@/lib/auth";
import { addRiskReviewForUser } from "@/lib/risk-register";
import { riskReviewSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = riskReviewSchema.parse(await request.json());
    const result = await addRiskReviewForUser(user, params.id, input);
    if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
