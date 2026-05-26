import { describe, expect, it } from "vitest";
import { buildIncidentWhere, buildOverdueRcaWhere } from "@/lib/dashboard-analytics";
import { buildIncidentWhere as buildIncidentListWhere } from "@/lib/incident-query";
import { activeIncidentFilter } from "@/lib/prisma-fields";

const activeFilter = activeIncidentFilter();
const withActiveFilter = (...filters: object[]) => ({
  AND: [...(activeFilter ? [activeFilter] : []), ...filters],
});

describe("dashboard query filters", () => {
  it("excludes closed and rejected incidents by default", () => {
    expect(buildIncidentWhere()).toEqual(withActiveFilter({ status: { not: "Rejected" } }, { status: { not: "Closed" } }));
  });

  it("allows closed incidents when explicitly requested", () => {
    expect(buildIncidentWhere({ includeClosed: "true" })).toEqual(withActiveFilter({ status: { not: "Rejected" } }));
  });

  it("uses unit-manager scope over a supplied unit filter", () => {
    expect(buildIncidentWhere({ scopeUnitId: "own-unit", unitId: "other-unit" })).toEqual(
      withActiveFilter({ status: { not: "Rejected" } }, { incidentUnitId: "own-unit" }, { status: { not: "Closed" } }),
    );
  });

  it("keeps executive/RM dashboard filters aggregate and non-identifying", () => {
    expect(buildIncidentWhere({ clinicalOrGeneral: "Clinical", simpleCategory: "M2" })).toEqual(
      withActiveFilter(
        { status: { not: "Rejected" } },
        { clinicalOrGeneral: "Clinical" },
        { simpleCategory: "M2" },
        { status: { not: "Closed" } },
      ),
    );
  });

  it("counts overdue RCA only when the RCA has not been submitted", () => {
    const now = new Date("2026-05-26T00:00:00.000Z");
    const base = buildIncidentWhere({ unitId: "unit-1" });
    expect(buildOverdueRcaWhere(base, now)).toEqual({
      AND: [
        base,
        {
          status: "RCARequired",
          rcaDueAt: { lt: now },
          OR: [{ rca: null }, { rca: { status: { in: ["Draft", "RevisionRequired"] } } }],
        },
      ],
    });
  });
});

describe("incident list RCA due filters", () => {
  it("filters overdue RCA list to unsubmitted RCA only", () => {
    const where = buildIncidentListWhere({ id: "rm-1", role: "RMTeam", unitId: null }, { rcaDue: "overdue" }) as any;
    expect(where.AND).toEqual([
      {},
      ...(activeFilter ? [activeFilter] : []),
      { status: { not: "Rejected" } },
      {
        status: "RCARequired",
        rcaDueAt: { lt: expect.any(Date) },
        OR: [{ rca: null }, { rca: { status: { in: ["Draft", "RevisionRequired"] } } }],
      },
    ]);
  });
});
