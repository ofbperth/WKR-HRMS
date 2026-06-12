import { apiError, requireUser } from "@/lib/auth";
import { linkIncidentsToRiskForUser } from "@/lib/risk-register";
import { riskLinkSchema } from "@/lib/validators";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = riskLinkSchema.parse(await request.json());
    const result = await linkIncidentsToRiskForUser(user, params.id, input.incidentIds, input.note ?? null);
    if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (result.linkedCount === 0 && result.duplicateIncidentIds.length > 0) {
      return Response.json({ error: "DUPLICATE_LINK", duplicateIncidentIds: result.duplicateIncidentIds }, { status: 409 });
    }
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
