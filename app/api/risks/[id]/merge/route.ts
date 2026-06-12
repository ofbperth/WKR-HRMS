import { apiError, requireUser } from "@/lib/auth";
import { mergeRiskProposalForUser } from "@/lib/risk-register";
import { riskMergeSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const input = riskMergeSchema.parse(await request.json());
    const updated = await mergeRiskProposalForUser(user, params.id, input.targetRiskId, input.note ?? null);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
