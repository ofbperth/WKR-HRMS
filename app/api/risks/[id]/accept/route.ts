import { apiError, requireUser } from "@/lib/auth";
import { acceptRiskForUser } from "@/lib/risk-register";
import { riskAcceptSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const input = riskAcceptSchema.parse(await request.json());
    const updated = await acceptRiskForUser(user, params.id, input.acceptedReason, input.note ?? null);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
