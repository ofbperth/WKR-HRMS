import { apiError, requireUser } from "@/lib/auth";
import { signedExportRedirect } from "@/lib/export-route";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    return signedExportRedirect(request, { kind: "action-csv", user });
  } catch (error) {
    return apiError(error);
  }
}
