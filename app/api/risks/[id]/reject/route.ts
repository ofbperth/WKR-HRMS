import { apiError, requireUser } from "@/lib/auth";
import { rejectRiskForUser } from "@/lib/risk-register";
import { riskDecisionSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const input = riskDecisionSchema.parse(await request.json());
    const updated = await rejectRiskForUser(user, params.id, input.note ?? null);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
