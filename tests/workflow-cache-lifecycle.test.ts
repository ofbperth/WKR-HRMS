import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionUpdate: vi.fn(), incidentFind: vi.fn(), incidentUpdate: vi.fn(),
  deleteCache: vi.fn(), audit: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/audit", () => ({ auditLog: mocks.audit }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  automationRun: { create: vi.fn(async () => ({ id: "run" })), update: vi.fn(async ({ data }) => data) },
  actionPlan: {
    findMany: vi.fn(async () => [{ id: "a", ownerId: null }, { id: "b", ownerId: null }]),
    update: mocks.actionUpdate,
  },
  incident: { findUnique: mocks.incidentFind, update: mocks.incidentUpdate },
  cacheEntry: { deleteMany: mocks.deleteCache },
} }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actionUpdate.mockResolvedValue({});
  mocks.incidentFind.mockResolvedValue({ id: "incident", lifecycleStatus: "SOFT_DELETED" });
  mocks.incidentUpdate.mockResolvedValue({ id: "incident", lifecycleStatus: "ACTIVE" });
});

describe("cache invalidation after background and lifecycle changes", () => {
  it("invalidates once after an overdue action batch, including partial failures", async () => {
    mocks.actionUpdate.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("second write failed"));
    const { runOverdueActionCheck } = await import("@/lib/automation-jobs");
    const result = await runOverdueActionCheck();
    expect(result.status).toBe("Failed");
    expect(mocks.deleteCache).toHaveBeenCalledOnce();
    expect(mocks.deleteCache).toHaveBeenCalledWith({ where: { cacheType: { in: ["dashboard", "search", "monthlySummary"] } } });
  });

  it("invalidates restored incident summaries even when subsequent auditing fails", async () => {
    mocks.audit.mockRejectedValueOnce(new Error("audit unavailable"));
    const { restoreIncidentLifecycle } = await import("@/lib/retention");
    await expect(restoreIncidentLifecycle("incident", { id: "admin", role: "Admin" })).rejects.toThrow("audit unavailable");
    expect(mocks.incidentUpdate).toHaveBeenCalled();
    expect(mocks.deleteCache).toHaveBeenCalledOnce();
  });
});
