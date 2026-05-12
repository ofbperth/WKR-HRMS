import { apiError, requireUser } from "@/lib/auth";
import { createIncidentWithAutomation } from "@/lib/incident-automation";
import { getIncidentList, removeSensitiveIncidentIdentifiers } from "@/lib/incident-query";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const incidents = await getIncidentList(user, params);
    return Response.json(incidents.map(removeSensitiveIncidentIdentifiers));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const json = await request.json();
    const incident = await createIncidentWithAutomation(json, user);
    return Response.json(removeSensitiveIncidentIdentifiers(incident), { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") return Response.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    if (error instanceof Error && error.message === "USER_UNIT_REQUIRED") return Response.json({ error: "User must select a unit before reporting an incident" }, { status: 400 });
    if (error instanceof Error && error.message === "INVALID_OCCURRED_AT") return Response.json({ error: "Invalid occurred date/time" }, { status: 400 });
    if (error instanceof Error && ["INVALID_RISK_CODE", "RISK_CODE_TYPE_MISMATCH", "INVALID_SEVERITY_FOR_TYPE"].includes(error.message)) return Response.json({ error: error.message }, { status: 400 });
    console.error("Incident create failed", error);
    return apiError(error);
  }
}
