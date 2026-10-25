import { describe, expect, it } from "vitest";
import { buildIncidentWhere } from "@/lib/incident-query";

const user = { id: "rm-test", role: "RMTeam" as const, unitId: null };

describe("related incident search", () => {
  it("accepts repeated q parameters from the safety goal link", () => {
    const q = new URLSearchParams("q=CPM101&q=CPM201&q=CPM202&q=CPM203&q=CPM204&q=CPM205").getAll("q");
    const where = buildIncidentWhere(user, { q }) as any;
    const search = where.AND.find((filter: any) => filter.OR);
    for (const code of q) {
      expect(search.OR).toContainEqual({ riskCode: { code: { contains: code } } });
    }
    expect(search.OR).toHaveLength(q.length * 6);
  });
  it("retains access scope and other filters with repeated queries", () => {
    const where = buildIncidentWhere({ id: "manager", role: "UnitManager", unitId: "own-unit" }, {
      q: ["CPM101", "CPM201"], severity: "F", status: "Closed",
    });
    expect(where.AND).toEqual(expect.arrayContaining([
      { incidentUnitId: "own-unit" }, { severity: "F" },
      { status: "Closed" }, { status: { not: "Rejected" } },
    ]));
  });
  it("ignores blank terms instead of broadening matches to all incidents", () => {
    expect(buildIncidentWhere(user, { q: [" ", "CPM101", ""] })).toEqual(buildIncidentWhere(user, { q: "CPM101" }));
    expect(buildIncidentWhere(user, { q: [" ", ""] })).toEqual(buildIncidentWhere(user, {}));
  });
  it("keeps ordinary single-term searches working", () => {
    expect(buildIncidentWhere(user, { q: " CPM101 " })).toMatchObject({
      AND: expect.arrayContaining([{ OR: expect.arrayContaining([{ riskCode: { code: { contains: "CPM101" } } }]) }]),
    });
  });
});
