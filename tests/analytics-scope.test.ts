import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), analytics: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.user, apiError: () => Response.json({}, { status: 500 }) }));
vi.mock("@/lib/dashboard-analytics", async (original) => ({
  ...await original<typeof import("@/lib/dashboard-analytics")>(),
  getDashboardAnalytics: mocks.analytics,
}));
vi.mock("@/lib/smart-cache", () => ({ getOrSetCachedValue: ({ loader }: { loader: () => unknown }) => loader() }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "manager", role: "UnitManager", unitId: "unit-A" });
  mocks.analytics.mockResolvedValue({ charts: { trend: [], topRiskCodes: [] } });
});

describe.each([
  ["trends", () => import("@/app/api/analytics/trends/route")],
  ["top-risk-codes", () => import("@/app/api/analytics/top-risk-codes/route")],
  ["unit dashboard", () => import("@/app/api/dashboard/unit/route")],
] as const)("%s scope", (_, loadRoute) => {
  it("binds UnitManager requests to their own unit despite a supplied unitId", async () => {
    const { GET } = await loadRoute();
    expect((await GET(new Request("https://example.test/api?unitId=unit-B"))).status).toBe(200);
    expect(mocks.analytics).toHaveBeenCalledWith(expect.objectContaining({ scopeUnitId: "unit-A" }));
  });
  it("denies a UnitManager without an assigned unit", async () => {
    mocks.user.mockResolvedValue({ id: "manager", role: "UnitManager", unitId: null });
    const { GET } = await loadRoute();
    expect((await GET(new Request("https://example.test/api?unitId=unit-B"))).status).toBe(428);
    expect(mocks.analytics).not.toHaveBeenCalled();
  });
  it("preserves Admin access to the requested unit", async () => {
    mocks.user.mockResolvedValue({ id: "admin", role: "Admin", unitId: "unit-A" });
    const { GET } = await loadRoute();
    expect((await GET(new Request("https://example.test/api?unitId=unit-B"))).status).toBe(200);
    expect(mocks.analytics).toHaveBeenCalledWith(expect.objectContaining({ unitId: "unit-B" }));
    expect(mocks.analytics.mock.calls[0][0].scopeUnitId).not.toBe("unit-A");
  });
});
