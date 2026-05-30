import { apiError, requireUser } from "@/lib/auth";
import { getIncidentAuditsForUser } from "@/lib/incident-query";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const take = Math.min(20, Math.max(1, Number(url.searchParams.get("take") ?? "10")));
    const cursor = url.searchParams.get("cursor") || undefined;
    const audits = await getIncidentAuditsForUser(params.id, user, take, cursor);
    if (!audits) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(audits);
  } catch (error) {
    return apiError(error);
  }
}
