import { apiError, requireUser } from "@/lib/auth";
import { getRiskDetailForUser, updateRiskForUser } from "@/lib/risk-register";
import { riskUpdateSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Executive", "Admin"]);
    const risk = await getRiskDetailForUser(params.id, user);
    if (!risk) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(risk);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = riskUpdateSchema.parse(await request.json());
    const updated = await updateRiskForUser(user, params.id, input);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
