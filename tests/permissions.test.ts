import { describe, expect, it } from "vitest";
import { canAccessApiPath, canAccessPath, canApproveRca, canManageIncident, canSeeSensitive, canSubmitRca } from "@/lib/rbac";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { scopeWhereForUser } from "@/lib/incident-query";

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
});
