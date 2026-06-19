import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const createComment = vi.fn();
const auditLog = vi.fn();
const hasScopedIncidentAccess = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireUser,
  apiError: (error: unknown) => Response.json({ error: error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR" }, { status: 500 }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: {
      create: createComment,
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  auditLog,
}));

vi.mock("@/lib/incident-query", () => ({
  hasScopedIncidentAccess,
  getIncidentCommentsForUser: vi.fn(),
}));

describe("incident comments route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: "unit-1", role: "UnitManager", unitId: "icu", name: "Unit Manager" });
    hasScopedIncidentAccess.mockResolvedValue(true);
    createComment.mockResolvedValue({ id: "comment-1", incidentId: "incident-1", userId: "unit-1", message: "ติดตามเคสนี้" });
  });

  it("allows UnitManager to add comments within their own unit scope", async () => {
    const route = await import("@/app/api/incidents/[id]/comments/route");
    const request = new Request("https://example.com/api/incidents/incident-1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "  ติดตามเคสนี้  " }),
    });

    const response = await route.POST(request, { params: { id: "incident-1" } });

    expect(response.status).toBe(201);
    expect(createComment).toHaveBeenCalledWith({
      data: { incidentId: "incident-1", userId: "unit-1", message: "ติดตามเคสนี้" },
    });
    expect(auditLog).toHaveBeenCalled();
  });

  it("blocks UnitManager from adding comments outside their unit scope", async () => {
    hasScopedIncidentAccess.mockResolvedValue(false);
    const route = await import("@/app/api/incidents/[id]/comments/route");
    const request = new Request("https://example.com/api/incidents/incident-1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ติดตามเคสนี้" }),
    });

    const response = await route.POST(request, { params: { id: "incident-1" } });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "NOT_FOUND" });
    expect(createComment).not.toHaveBeenCalled();
  });

  it("blocks comments for rejected or otherwise inactive incidents through shared scoped access", async () => {
    hasScopedIncidentAccess.mockResolvedValue(false);
    requireUser.mockResolvedValue({ id: "rm-1", role: "RMTeam", unitId: null, name: "RM Team" });
    const route = await import("@/app/api/incidents/[id]/comments/route");
    const request = new Request("https://example.com/api/incidents/incident-1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ติดตามเคสนี้" }),
    });

    const response = await route.POST(request, { params: { id: "incident-1" } });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "NOT_FOUND" });
    expect(createComment).not.toHaveBeenCalled();
  });
});
