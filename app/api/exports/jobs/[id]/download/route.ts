import { apiError, requireUser } from "@/lib/auth";
import { issueExportArtifactDownload } from "@/lib/export-jobs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const result = await issueExportArtifactDownload({ user, jobId: params.id });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "EXPORT_JOB_NOT_DOWNLOADABLE") {
      return Response.json({ error: "EXPORT_JOB_NOT_DOWNLOADABLE" }, { status: 409 });
    }
    return apiError(error);
  }
}
