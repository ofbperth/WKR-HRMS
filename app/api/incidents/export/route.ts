import { apiError, requireUser } from "@/lib/auth";
import { signedExportRedirect } from "@/lib/export-route";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    return signedExportRedirect(request, { kind: "incident-csv", user, filters: params });
  } catch (error) {
    return apiError(error);
  }
}
