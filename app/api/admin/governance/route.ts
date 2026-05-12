import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { getGovernanceDashboardData, getStorageConsistencyReport } from "@/lib/governance";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const mode = new URL(request.url).searchParams.get("mode");
    const data = mode === "consistency" ? await getStorageConsistencyReport() : await getGovernanceDashboardData();
    await auditLog({ userId: user.id, role: user.role, action: mode === "consistency" ? "VIEW_STORAGE_CONSISTENCY" : "VIEW_GOVERNANCE_DASHBOARD", entityType: "Governance" });
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
