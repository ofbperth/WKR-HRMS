import { describe, expect, it } from "vitest";
import { buildIncidentWhere } from "@/lib/dashboard-analytics";
import { activeIncidentFilter } from "@/lib/prisma-fields";

const activeFilter = activeIncidentFilter();
const withActiveFilter = (...filters: object[]) => ({
  AND: [...(activeFilter ? [activeFilter] : []), ...filters],
});

describe("dashboard query filters", () => {
  it("excludes closed and rejected incidents by default", () => {
    expect(buildIncidentWhere()).toEqual(withActiveFilter({ status: { notIn: ["Closed", "Rejected"] } }));
  });

  it("allows closed incidents when explicitly requested", () => {
    expect(buildIncidentWhere({ includeClosed: "true" })).toEqual(activeFilter ? { AND: [activeFilter] } : {});
  });

  it("uses unit-manager scope over a supplied unit filter", () => {
    expect(buildIncidentWhere({ scopeUnitId: "own-unit", unitId: "other-unit" })).toEqual(
      withActiveFilter({ incidentUnitId: "own-unit" }, { status: { notIn: ["Closed", "Rejected"] } }),
    );
  });

  it("keeps executive/RM dashboard filters aggregate and non-identifying", () => {
    expect(buildIncidentWhere({ clinicalOrGeneral: "Clinical", simpleCategory: "M2" })).toEqual(
      withActiveFilter(
        { clinicalOrGeneral: "Clinical" },
        { simpleCategory: "M2" },
        { status: { notIn: ["Closed", "Rejected"] } },
      ),
    );
  });
});
