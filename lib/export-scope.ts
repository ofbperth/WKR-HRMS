import type { ExportKind } from "@/lib/export-builders";
import type { SignedExportFilters } from "@/lib/signed-export";

type ExportUser = { id: string; role: string; unitId: string | null };

export function scopeForExport(kind: ExportKind, user: ExportUser, filters: SignedExportFilters) {
  if (user.role === "Reporter") return "OWN";
  if (user.role === "UnitManager") return "UNIT";
  if (user.role === "RMTeam" || user.role === "Admin") {
    if (kind === "audit-log-csv") return "ADMIN";
    return typeof filters.unitId === "string" && filters.unitId.trim() ? "UNIT_FILTERED" : "HOSPITAL";
  }
  return "NONE";
}

export function assertExportScope(kind: ExportKind, user: ExportUser, filters: SignedExportFilters) {
  if (user.role === "Reporter") return;
  if (user.role === "UnitManager") {
    if (typeof filters.unitId === "string" && user.unitId && filters.unitId !== user.unitId) {
      throw new Error("EXPORT_SCOPE_FORBIDDEN");
    }
    return;
  }
  if ((kind === "incident-csv" || kind === "rca-csv") && !["RMTeam", "Admin"].includes(user.role)) {
    throw new Error("EXPORT_SCOPE_FORBIDDEN");
  }
}
