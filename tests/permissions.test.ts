import { describe, expect, it } from "vitest";
import { canAccessApiPath, canAccessPath, canApproveRca, canManageIncident, canSeeSensitive, canSubmitRca } from "@/lib/rbac";
import { assertExportScope, scopeForExport } from "@/lib/export-scope";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { removeSensitiveIncidentIdentifiers, scopeWhereForUser } from "@/lib/incident-query";
import { isGoogleEmailAllowed } from "@/lib/auth-settings";
import { getReporterDisplayValue } from "@/components/incidents/incident-detail";

describe("role based access control", () => {
  it("scopes reporter incidents to their own reports", () => {
    expect(scopeWhereForUser({ id: "reporter-1", role: "Reporter", unitId: "unit-a" })).toEqual({ reportedById: "reporter-1" });
  });

  it("scopes unit managers to their own incident unit", () => {
    expect(scopeWhereForUser({ id: "unit-head", role: "UnitManager", unitId: "unit-a" })).toEqual({ incidentUnitId: "unit-a" });
    expect(canUnitManageIncident({ role: "UnitManager", unitId: "unit-a" }, { incidentUnitId: "unit-a" })).toBe(true);
    expect(canUnitManageIncident({ role: "UnitManager", unitId: "unit-a" }, { incidentUnitId: "unit-b" })).toBe(false);
  });

  it("allows RM/Admin to manage review and sensitive incident details", () => {
    expect(canManageIncident("RMTeam")).toBe(true);
    expect(canManageIncident("Admin")).toBe(true);
    expect(canSeeSensitive("RMTeam")).toBe(true);
    expect(canSeeSensitive("Reporter")).toBe(false);
  });

  it("keeps RCA submit and approval restricted to authorized roles", () => {
    expect(canSubmitRca("UnitManager")).toBe(true);
    expect(canSubmitRca("Admin")).toBe(true);
    expect(canSubmitRca("Reporter")).toBe(false);
    expect(canApproveRca("RMTeam")).toBe(true);
    expect(canApproveRca("Admin")).toBe(true);
    expect(canApproveRca("UnitManager")).toBe(false);
    expect(canAccessApiPath("Reporter", "/api/admin/users")).toBe(false);
  });

  it("keeps Admin dashboards available and Executive dashboards aggregate-route only", () => {
    expect(canAccessPath("Admin", "/rm/dashboard")).toBe(true);
    expect(canAccessPath("Admin", "/executive/dashboard")).toBe(true);
    expect(canAccessApiPath("Executive", "/api/dashboard/executive")).toBe(true);
    expect(canAccessApiPath("Executive", "/api/incidents")).toBe(false);
  });

  it("restricts direct sensitive identifier API access to RM/Admin only", () => {
    expect(canAccessApiPath("Reporter", "/api/incidents/incident-1/sensitive")).toBe(false);
    expect(canAccessApiPath("UnitManager", "/api/incidents/incident-1/sensitive")).toBe(false);
    expect(canAccessApiPath("RMTeam", "/api/incidents/incident-1/sensitive")).toBe(true);
    expect(canAccessApiPath("Admin", "/api/incidents/incident-1/sensitive")).toBe(true);
  });

  it("removes encrypted storage fields from incident API responses", () => {
    const result = removeSensitiveIncidentIdentifiers({
      id: "incident-1",
      patientHn: "1234567",
      patientAn: "7654321",
      hnEncrypted: "encrypted-hn",
      anEncrypted: "encrypted-an",
      reporterNameEncrypted: "encrypted-reporter",
      reportedBy: { id: "reporter-1", name: "Reporter Name" },
      rca: { id: "rca-1", rcaEncrypted: "encrypted-rca", status: "Draft" },
    }) as any;
    expect(result.patientHn).toBeNull();
    expect(result.patientAn).toBeNull();
    expect(result.reportedBy.name).toBe("[RESTRICTED]");
    expect(result).not.toHaveProperty("hnEncrypted");
    expect(result.rca).not.toHaveProperty("rcaEncrypted");
  });

  it("shows reporter identity to Admin on incident detail", () => {
    expect(getReporterDisplayValue({
      reportedBy: { id: "reporter-1", name: "Reporter Name", email: "reporter@example.com", role: "Reporter", unitId: "unit-a" },
      reporterDisplayName: "Fallback Reporter",
    } as any, "Admin")).toBe("Reporter Name");
  });

  it("keeps reporter identity restricted for non Admin roles on incident detail", () => {
    expect(getReporterDisplayValue({
      reportedBy: { id: "reporter-1", name: "Reporter Name", email: "reporter@example.com", role: "Reporter", unitId: "unit-a" },
      reporterDisplayName: "Fallback Reporter",
    } as any, "RMTeam")).toBe("จำกัดสิทธิ์");
    expect(getReporterDisplayValue({
      reportedBy: null,
      reporterDisplayName: "Deleted Reporter",
    } as any, "RMTeam")).toBe("Deleted Reporter");
  });

  it("accepts Google allowed domains with or without a leading at sign", () => {
    expect(isGoogleEmailAllowed("ofbperth@gmail.com", { allowedDomains: ["@gmail.com"], allowedEmails: [] })).toBe(true);
    expect(isGoogleEmailAllowed("ofbperth@gmail.com", { allowedDomains: ["gmail.com"], allowedEmails: [] })).toBe(true);
  });

  it("prevents hospital-wide incident export by non RM/Admin roles", () => {
    expect(scopeForExport("incident-csv", { id: "reporter-1", role: "Reporter", unitId: "unit-a" }, {})).toBe("OWN");
    expect(scopeForExport("incident-csv", { id: "unit-head", role: "UnitManager", unitId: "unit-a" }, {})).toBe("UNIT");
    expect(() => assertExportScope("incident-csv", { id: "unit-head", role: "UnitManager", unitId: "unit-a" }, { unitId: "unit-b" })).toThrow("EXPORT_SCOPE_FORBIDDEN");
    expect(() => assertExportScope("incident-csv", { id: "rm-1", role: "RMTeam", unitId: null }, {})).not.toThrow();
  });
});
