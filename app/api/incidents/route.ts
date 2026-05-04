import { apiError, requireUser } from "@/lib/auth";
import { createIncidentWithAutomation } from "@/lib/incident-automation";
import { getIncidentList } from "@/lib/incident-query";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const incidents = await getIncidentList(user, params);
    return Response.json(incidents);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["Reporter", "Admin"]);
    const json = await request.json();
    const incident = await createIncidentWithAutomation(json, user);
    return Response.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_UNIT_REQUIRED") return Response.json({ error: "ผู้ใช้ต้องมี unit ก่อนรายงาน incident" }, { status: 400 });
    if (error instanceof Error && error.message === "INVALID_OCCURRED_AT") return Response.json({ error: "วันที่/เวลาเกิดเหตุไม่ถูกต้อง" }, { status: 400 });
    return apiError(error);
  }
}
