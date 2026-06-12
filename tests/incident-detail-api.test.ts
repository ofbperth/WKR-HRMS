import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertIncidentDetailNoIdentifiers, INCIDENT_DETAIL_IDENTIFIER_ERROR_CODE, INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE } from "@/lib/incident-detail-identifiers";

const requireUser = vi.fn();
const createIncidentWithAutomation = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireUser,
  apiError: (error: unknown) => Response.json({ error: error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR" }, { status: 500 }),
}));

vi.mock("@/lib/incident-automation", () => ({
  createIncidentWithAutomation,
}));

vi.mock("@/lib/incident-query", () => ({
  removeSensitiveIncidentIdentifiers: (value: unknown) => value,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    incident: {
      findUnique,
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
}));

vi.mock("@/lib/incident-repository", () => ({
  incidentRepository: {},
}));

vi.mock("@/lib/rbac", () => ({
  canManageIncident: () => false,
}));

vi.mock("@/lib/workflow-permissions", () => ({
  canUnitManageIncident: () => false,
}));

vi.mock("@/lib/sensitive-fields", () => ({
  decryptLegacyIncidentIdentifier: vi.fn(),
  encryptedIncidentIdentifiers: vi.fn(),
}));

vi.mock("@/lib/smart-cache", () => ({
  invalidateSmartCache: vi.fn(),
}));

vi.mock("@/lib/incident-close", () => ({
  isIncidentClosed: () => false,
}));

vi.mock("@/lib/incident-lifecycle", () => ({
  deleteIncidentWithLifecycle: vi.fn(),
}));

describe("incident detail API identifier blocking", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: "user-1", role: "Reporter", unitId: "unit-1", name: "Reporter One" });
    createIncidentWithAutomation.mockImplementation(async (payload: { description: string }) => {
      assertIncidentDetailNoIdentifiers(payload.description);
      return { id: "incident-1", incidentNo: "RM-2026-0001" };
    });
    findUnique.mockResolvedValue({
      id: "incident-1",
      reportedById: "user-1",
      incidentUnitId: "unit-1",
      status: "New",
      rca: null,
    });
  });

  it("blocks create API submissions when incident detail contains patient identifiers", async () => {
    const route = await import("@/app/api/incidents/route");
    const request = new Request("https://example.com/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "ผู้ป่วยชื่อ สมชาย ใจดี มีการให้ยาคลาดเคลื่อน",
      }),
    });

    const response = await route.POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: INCIDENT_DETAIL_IDENTIFIER_ERROR_CODE,
      message: INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE,
      categories: ["ชื่อผู้ป่วย"],
    });
  });

  it("blocks update API submissions when incident detail contains patient identifiers", async () => {
    const route = await import("@/app/api/incidents/[id]/route");
    const request = new Request("https://example.com/api/incidents/incident-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "analysis พบ AN 660001 อยู่ในบันทึกของผู้ป่วยชื่อ สมชาย ใจดี",
      }),
    });

    const response = await route.PUT(request, { params: { id: "incident-1" } });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: INCIDENT_DETAIL_IDENTIFIER_ERROR_CODE,
      message: INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE,
      categories: ["AN", "ชื่อผู้ป่วย"],
    });
  });
});
