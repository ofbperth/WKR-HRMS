import { describe, expect, it } from "vitest";
import { buildIncidentWhere, buildOverdueRcaWhere, safetyGoals } from "@/lib/dashboard-analytics";
import { buildIncidentWhere as buildIncidentListWhere } from "@/lib/incident-query";
import { formatRcaDueCountdown } from "@/lib/format";
import { nrlsRiskCodes } from "@/lib/nrls-risk-codes";
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

describe("9 standard safety mappings", () => {
  it("uses the current 9 มาตรฐานสำคัญ NRLS codes", () => {
    expect(safetyGoals.map((goal) => goal.codes)).toEqual([
      ["CPS101", "CPS102", "CPS103"],
      ["CPI201", "CPI202", "CPI203", "CPS111"],
      ["GPI201", "GPI202", "GPI203", "GPI204"],
      ["CPM101", "CPM201", "CPM202", "CPM203", "CPM204", "CPM205"],
      ["CPM501"],
      ["CPP101"],
      ["CPP301"],
      ["CPL201", "CPL203"],
      ["CPE402", "CPE403", "CPE405", "CPE407"],
    ]);
  });

  it("keeps every 9 มาตรฐานสำคัญ code available in NRLS seed data", () => {
    const nrlsCodes = new Set<string>(nrlsRiskCodes.map((item) => item.code));
    for (const code of safetyGoals.flatMap((goal) => goal.codes)) {
      expect(nrlsCodes.has(code)).toBe(true);
    }
  });
});

describe("incident list RCA due filters", () => {
  it("uses OR semantics within multi-select SIMPLE filters", () => {
    const where = buildIncidentListWhere({ id: "rm-1", role: "RMTeam", unitId: null }, { simpleCategory: ["S1", "S2"], unitId: "unit-1" }) as any;
    expect(where.AND).toEqual([
      {},
      ...(activeFilter ? [activeFilter] : []),
      { status: { not: "Rejected" } },
      { incidentUnitId: "unit-1" },
      { simpleCategory: { in: ["S1", "S2"] } },
    ]);
  });

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

  it("filters RCA worklist to triaged incidents in the RCA lifecycle", () => {
    const where = buildIncidentListWhere({ id: "rm-1", role: "RMTeam", unitId: null }, { rcaWorklist: "true" }) as any;
    expect(where.AND).toEqual([
      {},
      ...(activeFilter ? [activeFilter] : []),
      { status: { not: "Rejected" } },
      { reviewedAt: { not: null } },
      { status: { in: ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"] } },
    ]);
  });
});

describe("RCA due countdown", () => {
  const now = new Date("2026-05-29T02:00:00.000Z");

  it("formats due date states using Bangkok calendar days", () => {
    expect(formatRcaDueCountdown(null, now)).toBe("ยังไม่กำหนด Due date");
    expect(formatRcaDueCountdown("2026-05-29T10:00:00.000Z", now)).toBe("ครบกำหนดวันนี้");
    expect(formatRcaDueCountdown("2026-06-01T10:00:00.000Z", now)).toBe("เหลือ 3 วัน");
    expect(formatRcaDueCountdown("2026-05-27T10:00:00.000Z", now)).toBe("เลยกำหนด 2 วัน");
  });
});
