import { apiError, requireUser } from "@/lib/auth";
import { signedExportRedirect } from "@/lib/export-route";

export const preferredRegion = "sin1";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    return signedExportRedirect(request, { kind: "rca-csv", user });
  } catch (error) {
    return apiError(error);
  }
}
