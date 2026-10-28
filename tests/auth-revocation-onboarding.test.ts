import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), session: vi.fn(), update: vi.fn(), unit: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "synthetic" }) }) }));
vi.mock("@/lib/session", () => ({ SESSION_COOKIE: "session", verifySessionToken: m.session, signSession: vi.fn(), refreshSessionUnit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.user, updateMany: m.update }, unit: { findFirst: m.unit } } }));
vi.mock("@/lib/audit", () => ({ auditLog: vi.fn() }));
import { getCurrentUser } from "@/lib/auth";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/onboarding/unit/route";
const identity = { id: "manager", role: "UnitManager", unitId: "A", isActive: true };
beforeEach(() => { vi.clearAllMocks(); m.user.mockResolvedValue(identity); m.session.mockResolvedValue(identity); m.unit.mockResolvedValue({ id: "B", name: "B" }); m.update.mockResolvedValue({ count: 1 }); });
describe("authorization revocation", () => {
  it.each([{ role: "Reporter" }, { unitId: "B" }, { isActive: false }])("rejects stale session after %j", async change => { m.user.mockResolvedValue({ ...identity, ...change }); expect(await getCurrentUser()).toBeNull(); });
  it("allows reauthentication without redirecting a stale JWT back into a protected page", async () => {
    const response = await middleware(new NextRequest("https://example.test/login", { headers: { cookie: "session=synthetic" } }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it("accepts a current authorized session", async () => { expect(await getCurrentUser()).toEqual(identity); });
});
describe("unit onboarding", () => {
  const request = () => new Request("https://example.test", { method: "POST", body: JSON.stringify({ unitId: "B" }) });
  it("does not let an assigned manager move units", async () => { expect((await POST(request())).status).toBe(409); expect(m.update).not.toHaveBeenCalled(); });
  it("allows first selection using a compare-and-set", async () => { m.user.mockResolvedValue({ ...identity, unitId: null }); m.session.mockResolvedValue({ ...identity, unitId: null }); expect((await POST(request())).status).toBe(200); expect(m.update).toHaveBeenCalledWith({ where: { id: "manager", unitId: null }, data: { unitId: "B" } }); });
  it("rejects concurrent reassignment without issuing success", async () => { m.user.mockResolvedValue({ ...identity, unitId: null }); m.session.mockResolvedValue({ ...identity, unitId: null }); m.update.mockResolvedValue({ count: 0 }); expect((await POST(request())).status).toBe(409); });
});
