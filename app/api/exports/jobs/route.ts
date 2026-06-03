import { apiError, requireUser } from "@/lib/auth";
import { listUserExportJobs } from "@/lib/export-jobs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const kind = url.searchParams.get("kind");
    const status = url.searchParams.get("status");
    const result = await listUserExportJobs({ user, kind, status, page, pageSize });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
