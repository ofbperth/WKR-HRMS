import { apiError, requireUser } from "@/lib/auth";
import { getIncidentList } from "@/lib/incident-query";
import { auditLog } from "@/lib/audit";
import { maskHn } from "@/lib/format";
import { canSeeSensitive } from "@/lib/rbac";

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const incidents = await getIncidentList(user, params);
    const sensitive = canSeeSensitive(user.role);
    const header = ["Incident No", "Occurred At", "Unit", "Title", "Risk Code", "Severity", "Sentinel", "Need RM Support", "Status", "Reporter", "Patient HN", "Updated At"];
    const rows = incidents.map(i => [i.incidentNo, i.occurredAt.toISOString(), i.incidentUnit.name, i.title, i.riskCode.code, i.severity, i.isSentinel ? "Yes" : "No", i.needRmSupport ? "Yes" : "No", i.status, i.reportedBy.name, sensitive ? (i.patientHn ?? "") : maskHn(i.patientHn), i.updatedAt.toISOString()]);
    const csv = [header, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
    await auditLog({ userId: user.id, action: "export CSV", entityType: "Incident", newValue: { filters: params, count: incidents.length } });
    return new Response(`\ufeff${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="incident-export-${Date.now()}.csv"` } });
  } catch (error) {
    return apiError(error);
  }
}
