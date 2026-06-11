import { apiError, requireUser } from "@/lib/auth";
import { createIncidentWithAutomation } from "@/lib/incident-automation";
import { removeSensitiveIncidentIdentifiers } from "@/lib/incident-query";
import { incidentRepository } from "@/lib/incident-repository";

export const preferredRegion = "sin1";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      const current = params[key];
      if (current === undefined) params[key] = value;
      else if (Array.isArray(current)) current.push(value);
      else params[key] = [current, value];
    });
    const incidents = await incidentRepository.listForUser(user, params);
    return Response.json(incidents);
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
