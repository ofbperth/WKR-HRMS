import { apiError, requireUser } from "@/lib/auth";
import { restoreIncidentLifecycle } from "@/lib/retention";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Admin"]);
    const incident = await restoreIncidentLifecycle(params.id, user);
    return Response.json(incident);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (error instanceof Error && error.message === "RESTORE_NOT_ALLOWED_FOR_STATE") return Response.json({ error: "RESTORE_NOT_ALLOWED_FOR_STATE" }, { status: 409 });
    return apiError(error);
  }
}
