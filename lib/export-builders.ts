import "server-only";
import { prisma } from "@/lib/prisma";
import { getIncidentExportRows } from "@/lib/incident-query";

type ExportUser = { id: string; role: string; unitId: string | null };

export type ExportKind = "incident-csv" | "action-csv" | "rca-csv" | "audit-log-csv";

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(filename: string, header: string[], rows: unknown[][]) {
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  return {
    filename,
    contentType: "text/csv; charset=utf-8",
    body: `\ufeff${csv}`,
  };
}

export async function buildIncidentCsv(user: ExportUser, filters: Record<string, string>) {
  const incidents = await getIncidentExportRows(user as any, filters, 1000);
  const header = ["Incident No", "Occurred At", "Reported At", "Incident Unit", "Reporter Unit", "Title", "Risk Code", "Clinical/General", "SIMPLE Category", "Severity", "Sentinel", "Need RM Support", "Status", "Reporter", "Patient HN", "Patient AN"];
  const rows = incidents.map((i) => [i.incidentNo, i.occurredAt.toISOString(), i.reportedAt.toISOString(), i.incidentUnit.name, i.reporterUnit.name, i.title, i.riskCode.code, i.clinicalOrGeneral, i.simpleCategory, i.severity, i.isSentinel ? "Yes" : "No", i.needRmSupport ? "Yes" : "No", i.status, "Restricted", "Restricted", "Restricted"]);
  return { ...csvResponse(`incident-export-${Date.now()}.csv`, header, rows), count: incidents.length };
}

export async function buildActionCsv(user: ExportUser) {
  const where =
    user.role === "Reporter"
      ? { ownerId: user.id }
      : user.role === "UnitManager"
        ? { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } }
        : {};
  const actions = await prisma.actionPlan.findMany({
    where,
    include: { incident: { include: { incidentUnit: true } }, owner: { select: { email: true } }, verifiedBy: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 1000,
  });
  const header = ["Incident No", "Unit", "Action", "Owner", "Due Date", "Status", "Verified By", "Verified At"];
  const rows = actions.map((action) => [
    action.incident.incidentNo,
    action.incident.incidentUnit.name,
    action.title,
    action.owner?.email ?? "Unassigned",
    action.dueDate.toISOString().slice(0, 10),
    action.status,
    action.verifiedBy?.name ?? "",
    action.verifiedAt?.toISOString() ?? "",
  ]);
  return { ...csvResponse(`action-export-${Date.now()}.csv`, header, rows), count: actions.length };
}

export async function buildRcaCsv(user: ExportUser) {
  const where = user.role === "UnitManager" ? { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } } : {};
  const rcas = await prisma.rCA.findMany({
    where,
    include: { incident: { include: { incidentUnit: true, riskCode: true } }, kpiOwner: { select: { email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });
  const header = ["Incident No", "Unit", "Risk Code", "Severity", "Incident Status", "RCA Status", "Submitted At", "Approved At", "KPI Owner", "Need RM Support"];
  const rows = rcas.map((rca) => [
    rca.incident.incidentNo,
    rca.incident.incidentUnit.name,
    rca.incident.riskCode.code,
    rca.incident.severity,
    rca.incident.status,
    rca.status,
    rca.submittedAt?.toISOString() ?? "",
    rca.approvedAt?.toISOString() ?? "",
    rca.kpiOwner?.email ?? "",
    rca.needRmSupport ? "Yes" : "No",
  ]);
  return { ...csvResponse(`rca-export-${Date.now()}.csv`, header, rows), count: rcas.length };
}

export async function buildAuditLogCsv(filters: Record<string, string>) {
  const action = filters.action?.trim();
  const entityType = filters.entityType?.trim();
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action: { contains: action } } : {}),
      ...(entityType ? { entityType } : {}),
    },
    include: { user: { select: { email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const header = ["Created At", "User", "Role", "Action", "Entity Type", "Entity ID", "Old Value", "New Value"];
  const rows = logs.map((log) => [log.createdAt.toISOString(), log.user?.email ?? "system", log.user?.role ?? "-", log.action, log.entityType, log.entityId ?? "", log.oldValue ?? "", log.newValue ?? ""]);
  return { ...csvResponse(`audit-log-${Date.now()}.csv`, header, rows), count: logs.length };
}

export async function buildExport(kind: ExportKind, user: ExportUser, filters: Record<string, string>) {
  if (kind === "incident-csv") return buildIncidentCsv(user, filters);
  if (kind === "action-csv") return buildActionCsv(user);
  if (kind === "rca-csv") return buildRcaCsv(user);
  if (kind === "audit-log-csv") return buildAuditLogCsv(filters);
  throw new Error("UNKNOWN_EXPORT_KIND");
}
