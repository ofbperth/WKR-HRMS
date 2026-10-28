import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readAnalyticsRows } from "@/lib/analytics-pagination";

const mocks = vi.hoisted(() => ({ incidents: vi.fn(), rcas: vi.fn(), actions: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  incident: { count: vi.fn(async () => 1501), groupBy: vi.fn(async () => []), findMany: mocks.incidents },
  rCA: { count: vi.fn(async () => 1501), findMany: mocks.rcas },
  actionPlan: { count: vi.fn(async () => 1501), groupBy: vi.fn(async () => []), findMany: mocks.actions },
} }));
vi.mock("@/lib/incident-query", () => ({
  getLookupData: async () => ({ units: [{ id: "unit", name: "Unit" }], riskCodes: [{ id: "risk", code: "CPS101", nameTh: "Safety" }], simpleCategories: [] }),
  getDashboardFilterLookups: async () => ({ units: [], simpleCategories: [] }),
}));

function page<T extends { id: string }>(rows: T[], args: { take: number; cursor?: { id: string }; skip?: number }) {
  const start = args.cursor ? rows.findIndex(row => row.id === args.cursor!.id) + (args.skip ?? 0) : 0;
  return rows.slice(start, start + args.take);
}
const rows = Array.from({ length: 1501 }, (_, index) => ({
  id: String(index).padStart(5, "0"), occurredAt: new Date("2026-10-10T00:00:00Z"), severity: "E", isSentinel: false,
  incident: { incidentUnitId: "unit", severity: "E" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T00:00:00Z"));
  mocks.incidents.mockImplementation(async args => args.select.title ? [] : page(rows, args));
  mocks.rcas.mockImplementation(async args => page(rows, args));
  mocks.actions.mockImplementation(async args => page(rows, args));
});
afterEach(() => vi.useRealTimers());

describe("complete analytics across page boundaries", () => {
  it("honors includeClosed on safety-goal reports as well as dashboards", async () => {
    mocks.incidents.mockImplementation(async args => {
      const statusFilter = args.where.AND[0].AND.find((filter: { status?: unknown }) => filter.status).status;
      return statusFilter.notIn?.includes("Closed") ? [] : [{ ...rows[0], riskCodeId: "risk", rca: null, actionPlans: [] }];
    });
    const { getSafetyGoalAnalytics } = await import("@/lib/dashboard-analytics");
    const excluded = await getSafetyGoalAnalytics({});
    const included = await getSafetyGoalAnalytics({ includeClosed: "true" });
    expect(excluded.find(goal => goal.id === "safe-surgery")?.count).toBe(0);
    expect(included.find(goal => goal.id === "safe-surgery")?.count).toBe(1);
  });

  it("counts every trend, pending RCA and overdue action beyond the old caps", async () => {
    const { getDashboardAnalytics } = await import("@/lib/dashboard-analytics");
    const result = await getDashboardAnalytics({ includeClosed: "true", scopeUnitId: "unit" });
    expect(result.charts.trend.reduce((total, item) => total + item.total, 0)).toBe(1501);
    expect(result.charts.openRcaByUnit[0].value).toBe(1501);
    expect(result.charts.overdueActionByUnit[0].value).toBe(1501);
    expect(mocks.rcas).toHaveBeenCalledTimes(4);
    expect(mocks.actions).toHaveBeenCalledTimes(4);
    for (const [args] of mocks.rcas.mock.calls) {
      expect(args.where.incident.AND).toContainEqual({ incidentUnitId: "unit" });
    }
  });
  it.each([0, 1, 500, 1000, 1501])("returns %i rows exactly once", async (count) => {
    const data = rows.slice(0, count);
    const loaded = await readAnalyticsRows(async args => page(data, args));
    expect(loaded.map(row => row.id)).toEqual(data.map(row => row.id));
  });
  it("propagates a later page failure instead of returning a partial total", async () => {
    let calls = 0;
    await expect(readAnalyticsRows(async args => {
      if (++calls === 2) throw new Error("database unavailable");
      return page(rows, args);
    })).rejects.toThrow("database unavailable");
  });
});
