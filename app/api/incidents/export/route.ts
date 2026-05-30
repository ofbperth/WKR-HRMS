import { apiError, requireUser } from "@/lib/auth";
import { signedExportRedirect } from "@/lib/export-route";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      const existing = params[key];
      if (Array.isArray(existing)) existing.push(value);
      else if (existing) params[key] = [existing, value];
      else params[key] = value;
    });
    return signedExportRedirect(request, { kind: "incident-csv", user, filters: params });
  } catch (error) {
    return apiError(error);
  }
}
