import "server-only";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { buildIncidentWhere } from "@/lib/incident-query";
import type { IncidentAccessUser } from "@/lib/incident-query";
import type { SignedExportFilters } from "@/lib/signed-export";
import type { ExportKind } from "@/lib/types";

type ExportUser = { id: string; role: string; unitId: string | null };

const exportPageSize = 1000;
const textEncoder = new TextEncoder();

export type ExportArtifact = {
  filename: string;
  contentType: string;
  body: ReadableStream<Uint8Array>;
  count: number;
};

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvLine(values: unknown[]) {
  return values.map(csvEscape).join(",");
}

function csvFilename(prefix: string) {
  return `${prefix}-${Date.now()}.csv`;
}

function csvStreamFromPages<T>(input: {
  header: string[];
  loadPage: (skip: number, take: number) => Promise<T[]>;
  mapRow: (row: T) => unknown[];
}) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(textEncoder.encode(`\ufeff${csvLine(input.header)}\n`));
      let skip = 0;

      while (true) {
        const rows = await input.loadPage(skip, exportPageSize);
        if (rows.length === 0) break;

        for (const row of rows) {
          controller.enqueue(textEncoder.encode(`${csvLine(input.mapRow(row))}\n`));
        }

        if (rows.length < exportPageSize) break;
        skip += rows.length;
      }

      controller.close();
    },
  });
}

async function buildCsvInPages<T>(input: {
  filename: string;
  header: string[];
  countRows: () => Promise<number>;
  loadPage: (skip: number, take: number) => Promise<T[]>;
  mapRow: (row: T) => unknown[];
}): Promise<ExportArtifact> {
  const count = await input.countRows();
  return {
    filename: input.filename,
    contentType: "text/csv; charset=utf-8",
    body: csvStreamFromPages(input),
    count,
  };
}

function buildActionWhere(user: ExportUser) {
  return user.role === "Reporter"
    ? { ownerId: user.id }
    : user.role === "UnitManager"
      ? { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } }
      : {};
}

function buildRcaWhere(user: ExportUser) {
  return user.role === "UnitManager" ? { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } } : {};
}

function buildAuditWhere(filters: SignedExportFilters) {
  const action = typeof filters.action === "string" ? filters.action.trim() : "";
  const entityType = typeof filters.entityType === "string" ? filters.entityType.trim() : "";
  return {
    ...(action ? { action: { contains: action } } : {}),
    ...(entityType ? { entityType } : {}),
  };
}

export async function buildIncidentCsv(user: ExportUser, filters: SignedExportFilters) {
  const where = buildIncidentWhere(user as IncidentAccessUser, filters);
  const header = ["Incident No", "Occurred At", "Reported At", "Incident Unit", "Reporter Unit", "Related Teams", "Title", "Risk Code", "Clinical/General", "SIMPLE Category", "Severity", "Sentinel", "Need RM Support", "Status", "Reporter", "Patient HN", "Patient AN"];
  return buildCsvInPages({
    filename: csvFilename("incident-export"),
    header,
    countRows: () => prisma.incident.count({ where }),
    loadPage: (skip, take) => prisma.incident.findMany({
      where,
      select: {
        incidentNo: true,
        occurredAt: true,
        reportedAt: true,
        title: true,
        clinicalOrGeneral: true,
        simpleCategory: true,
        severity: true,
        isSentinel: true,
        needRmSupport: true,
        status: true,
        incidentUnit: { select: { name: true } },
        reporterUnit: { select: { name: true } },
        riskCode: { select: { code: true } },
        incidentTeams: {
          select: { team: { select: { name: true, sortOrder: true } } },
          orderBy: [{ team: { sortOrder: "asc" } }, { team: { name: "asc" } }],
        },
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    mapRow: (incident) => [
      incident.incidentNo,
      formatDateTime(incident.occurredAt),
      formatDateTime(incident.reportedAt),
      incident.incidentUnit.name,
      incident.reporterUnit.name,
      incident.incidentTeams.map(({ team }) => team.name).join(", "),
      incident.title,
      incident.riskCode.code,
      incident.clinicalOrGeneral,
      incident.simpleCategory,
      incident.severity,
      incident.isSentinel ? "Yes" : "No",
      incident.needRmSupport ? "Yes" : "No",
      incident.status,
      "Restricted",
      "Restricted",
      "Restricted",
    ],
  });
}

export async function buildActionCsv(user: ExportUser) {
  const where = buildActionWhere(user);
  const header = ["Incident No", "Unit", "Action", "Owner", "Due Date", "Status", "Verified By", "Verified At"];
  return buildCsvInPages({
    filename: csvFilename("action-export"),
    header,
    countRows: () => prisma.actionPlan.count({ where }),
    loadPage: (skip, take) => prisma.actionPlan.findMany({
      where,
      include: { incident: { include: { incidentUnit: true } }, owner: { select: { email: true } }, verifiedBy: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      skip,
      take,
    }),
    mapRow: (action) => [
      action.incident.incidentNo,
      action.incident.incidentUnit.name,
      action.title,
      action.owner?.email ?? "Unassigned",
      formatDateTime(action.dueDate),
      action.status,
      action.verifiedBy?.name ?? "",
      formatDateTime(action.verifiedAt),
    ],
  });
}

export async function buildRcaCsv(user: ExportUser) {
  const where = buildRcaWhere(user);
  const header = ["Incident No", "Unit", "Risk Code", "Severity", "Incident Status", "RCA Status", "Submitted At", "Approved At", "KPI Owner", "Need RM Support"];
  return buildCsvInPages({
    filename: csvFilename("rca-export"),
    header,
    countRows: () => prisma.rCA.count({ where }),
    loadPage: (skip, take) => prisma.rCA.findMany({
      where,
      include: { incident: { include: { incidentUnit: true, riskCode: true } }, kpiOwner: { select: { email: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    mapRow: (rca) => [
      rca.incident.incidentNo,
      rca.incident.incidentUnit.name,
      rca.incident.riskCode.code,
      rca.incident.severity,
      rca.incident.status,
      rca.status,
      formatDateTime(rca.submittedAt),
      formatDateTime(rca.approvedAt),
      rca.kpiOwner?.email ?? "",
      rca.needRmSupport ? "Yes" : "No",
    ],
  });
}

export async function buildAuditLogCsv(filters: SignedExportFilters) {
  const where = buildAuditWhere(filters);
  const header = ["Created At", "User", "Role", "Action", "Entity Type", "Entity ID", "Old Value", "New Value"];
  return buildCsvInPages({
    filename: csvFilename("audit-log"),
    header,
    countRows: () => prisma.auditLog.count({ where }),
    loadPage: (skip, take) => prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    mapRow: (log) => [
      formatDateTime(log.createdAt),
      log.user?.email ?? "system",
      log.user?.role ?? "-",
      log.action,
      log.entityType,
      log.entityId ?? "",
      log.oldValue ?? "",
      log.newValue ?? "",
    ],
  });
}

export async function buildExport(kind: ExportKind, user: ExportUser, filters: SignedExportFilters) {
  if (kind === "incident-csv") return buildIncidentCsv(user, filters);
  if (kind === "action-csv") return buildActionCsv(user);
  if (kind === "rca-csv") return buildRcaCsv(user);
  if (kind === "audit-log-csv") return buildAuditLogCsv(filters);
  throw new Error("UNKNOWN_EXPORT_KIND");
}
