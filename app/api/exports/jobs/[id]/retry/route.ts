import { apiError, requireUser } from "@/lib/auth";
import { retryExportJob } from "@/lib/export-jobs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const job = await retryExportJob({ request, user, jobId: params.id });
    return Response.json(job);
  } catch (error) {
    if (error instanceof Error && error.message === "EXPORT_JOB_RETRY_NOT_ALLOWED") {
      return Response.json({ error: "EXPORT_JOB_RETRY_NOT_ALLOWED" }, { status: 409 });
    }
    return apiError(error);
  }
}
