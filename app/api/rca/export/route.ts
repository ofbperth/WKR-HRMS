import { apiError, requireUser } from "@/lib/auth";
import { createExportJob } from "@/lib/export-jobs";
import { exportRequestSchema } from "@/lib/validators";

export const preferredRegion = "sin1";

export async function POST(request: Request) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const body = exportRequestSchema.parse(await request.json());
    const job = await createExportJob({
      request,
      kind: "rca-csv",
      user,
      reason: body.reason,
      filters: body.filters,
    });
    return Response.json({ jobId: job.id, status: job.status });
  } catch (error) {
    if (error instanceof Error && error.message === "EXPORT_SCOPE_FORBIDDEN") return Response.json({ error: "EXPORT_SCOPE_FORBIDDEN" }, { status: 403 });
    if (error instanceof Error && error.message === "EXPORT_RATE_LIMITED") return Response.json({ error: "EXPORT_RATE_LIMITED" }, { status: 429 });
    return apiError(error);
  }
}
