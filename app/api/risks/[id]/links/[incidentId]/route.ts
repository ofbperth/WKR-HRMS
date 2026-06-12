import { apiError, requireUser } from "@/lib/auth";
import { unlinkIncidentFromRiskForUser } from "@/lib/risk-register";

export async function DELETE(_: Request, { params }: { params: { id: string; incidentId: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const result = await unlinkIncidentFromRiskForUser(user, params.id, params.incidentId);
    if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
