import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  incidentFind: vi.fn(), incidentUpdate: vi.fn(),
  actionFind: vi.fn(), actionUpdate: vi.fn(), actionCreate: vi.fn(), actionCount: vi.fn(),
  rcaWrite: vi.fn(), rcaUpdate: vi.fn(),
  invalidate: vi.fn(), audit: vi.fn(),
  createIncident: vi.fn(), riskFind: vi.fn(),
  transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
  apiError: (error: unknown) => Response.json({ error: String(error) }, { status: 500 }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  incident: { findUnique: mocks.incidentFind, update: mocks.incidentUpdate },
  actionPlan: { findUnique: mocks.actionFind, update: mocks.actionUpdate, create: mocks.actionCreate, count: mocks.actionCount },
  rCA: { upsert: mocks.rcaWrite, update: mocks.rcaUpdate },
  riskCode: { findUnique: mocks.riskFind },
  user: { findMany: vi.fn(async () => []) },
  notification: { create: vi.fn(), createMany: vi.fn() },
  $transaction: mocks.transaction,
} }));
vi.mock("@/lib/audit", () => ({ auditLog: mocks.audit }));
vi.mock("@/lib/smart-cache", () => ({ invalidateSmartCache: mocks.invalidate }));
vi.mock("@/lib/notifications", () => ({ notifyRmTeam: vi.fn() }));
vi.mock("@/lib/action-policy", () => ({ validateActionOwnerAssignment: vi.fn() }));
vi.mock("@/lib/sensitive-fields", () => ({ encryptedRcaNarrative: () => "synthetic-ciphertext", encryptedIncidentIdentifiers: vi.fn(), decryptLegacyIncidentIdentifier: vi.fn() }));
vi.mock("@/lib/rca-repository", () => ({ rcaRepository: { getForUser: vi.fn(async () => ({ id: "rca" })) } }));
vi.mock("@/lib/incident-lifecycle", () => ({ deleteIncidentWithLifecycle: vi.fn() }));
vi.mock("@/lib/incident-automation", () => ({ createIncidentWithAutomation: mocks.createIncident }));

const context = { params: { id: "incident" } };
const request = (body: unknown, method = "POST") => new Request("https://example.test/api", { method, body: JSON.stringify(body) });
const incident = (overrides: Record<string, unknown> = {}) => ({
  id: "incident", incidentNo: "RM-TEST", incidentUnitId: "unit", reportedById: "reporter",
  status: "RCARequired", severity: "E", clinicalOrGeneral: "Clinical", riskCodeId: "risk",
  reportedAt: new Date("2026-10-01T00:00:00Z"), reviewedAt: null, deletedAt: null,
  rca: null, actionPlans: [], ...overrides,
});
const rcaInput = { problemStatement: "Problem", rootCause: "Root cause", preventiveAction: "Prevention", submit: false };
const classification = { severity: "E", riskCodeId: "risk", status: "Closed", isSentinel: false, needRmSupport: false };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "reporter", role: "RMTeam", unitId: "unit", name: "Synthetic" });
  mocks.riskFind.mockResolvedValue({ id: "risk", clinicalOrGeneral: "Clinical", simpleCategory: "S", isActive: true });
  mocks.incidentFind.mockResolvedValue(incident());
  mocks.incidentUpdate.mockImplementation(async ({ data }) => ({ ...incident(), ...data }));
  mocks.actionFind.mockResolvedValue({ id: "action", ownerId: "reporter", incidentId: "incident", status: "Ongoing", incident: incident({ status: "ActionOngoing" }) });
  mocks.actionUpdate.mockImplementation(async ({ data }) => ({ id: "action", ...data }));
  mocks.actionCreate.mockImplementation(async ({ data }) => ({ id: "action", ...data }));
  mocks.actionCount.mockResolvedValue(0);
  mocks.rcaWrite.mockResolvedValue({ id: "rca" });
  mocks.rcaUpdate.mockImplementation(async ({ data }) => ({ id: "rca", ...data }));
});

describe("workflow audit regressions", () => {
  it.each(["Reporter", "UnitManager", "RMTeam", "Admin"])("prevents %s from bypassing verification through action PUT", async (role) => {
    mocks.requireUser.mockResolvedValue({ id: "reporter", role, unitId: "unit" });
    const { PUT } = await import("@/app/api/actions/[id]/route");
    expect((await PUT(request({ status: "Verified" }, "PUT"), context)).status).toBe(403);
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it.each(["Submitted", "Approved"])("locks %s RCA against edits and resubmission", async (status) => {
    mocks.requireUser.mockResolvedValue({ id: "manager", role: "UnitManager", unitId: "unit" });
    mocks.incidentFind.mockResolvedValue(incident({ status: "ActionOngoing", rca: { status } }));
    const { PUT } = await import("@/app/api/incidents/[id]/rca/route");
    for (const submit of [false, true]) {
      expect((await PUT(request({ ...rcaInput, submit }, "PUT"), context)).status).toBe(409);
    }
    expect(mocks.rcaWrite).not.toHaveBeenCalled();
  });

  it.each(["Draft", "RevisionRequired"])("allows editing %s RCA", async (status) => {
    mocks.incidentFind.mockResolvedValue(incident({ rca: { status } }));
    const { PUT } = await import("@/app/api/incidents/[id]/rca/route");
    expect((await PUT(request(rcaInput, "PUT"), context)).status).toBe(200);
    expect(mocks.rcaWrite).toHaveBeenCalled();
    expect(mocks.invalidate).toHaveBeenCalled();
  });

  it.each(["Closed", "Rejected"])("does not reopen %s incidents through RCA decisions", async (status) => {
    const { POST } = await import("@/app/api/incidents/[id]/rca/approve/route");
    for (const approved of [false, true]) {
      mocks.incidentFind.mockResolvedValue(incident({ status, rca: { status: approved ? "Submitted" : "Approved" } }));
      expect((await POST(request({ approved }), context)).status).toBe(409);
    }
    expect(mocks.incidentUpdate).not.toHaveBeenCalled();
    expect(mocks.rcaUpdate).not.toHaveBeenCalled();
  });

  it("does not revise a soft-deleted incident", async () => {
    mocks.incidentFind.mockResolvedValue(incident({ deletedAt: new Date(), rca: { status: "Approved" } }));
    const { POST } = await import("@/app/api/incidents/[id]/rca/approve/route");
    expect((await POST(request({ approved: false }), context)).status).toBe(409);
    expect(mocks.rcaUpdate).not.toHaveBeenCalled();
  });

  it.each(["RCARequired", "RCASubmitted", "New"])("rejects closing %s without completed workflow via classification PUT", async (status) => {
    mocks.incidentFind.mockResolvedValue(incident({ status }));
    const { PUT } = await import("@/app/api/incidents/[id]/route");
    expect((await PUT(request(classification, "PUT"), context)).status).toBe(409);
    expect(mocks.incidentUpdate).not.toHaveBeenCalled();
  });

  it("rejects closing an incident with an unverified action", async () => {
    mocks.incidentFind.mockResolvedValue(incident({ status: "WaitingVerification", rca: { status: "Approved" }, actionPlans: [{ status: "Done" }] }));
    const { PUT } = await import("@/app/api/incidents/[id]/route");
    expect((await PUT(request(classification, "PUT"), context)).status).toBe(409);
    expect(mocks.incidentUpdate).not.toHaveBeenCalled();
  });

  it("cannot bypass closure checks by first downgrading RCARequired to UnderReview", async () => {
    const { PUT } = await import("@/app/api/incidents/[id]/route");
    expect((await PUT(request({ ...classification, status: "UnderReview" }, "PUT"), context)).status).toBe(409);
    expect(mocks.incidentUpdate).not.toHaveBeenCalled();
  });

  it("still allows RM to reject a report or update classification without changing workflow", async () => {
    const { PUT } = await import("@/app/api/incidents/[id]/route");
    for (const status of ["RCARequired", "Rejected"]) {
      expect((await PUT(request({ ...classification, status }, "PUT"), context)).status).toBe(200);
    }
  });

  it.each([
    { status: "UnderReview", rca: null, actionPlans: [] },
    { status: "WaitingVerification", rca: { status: "Approved" }, actionPlans: [{ status: "Verified" }] },
  ])("allows a valid close through both endpoints: $status", async (state) => {
    mocks.incidentFind.mockResolvedValue(incident(state));
    const { PUT } = await import("@/app/api/incidents/[id]/route");
    const { POST } = await import("@/app/api/incidents/[id]/close/route");
    expect((await PUT(request(classification, "PUT"), context)).status).toBe(200);
    expect((await POST(request({}), context)).status).toBe(200);
  });

  it("omits authentication data from the actual create API response", async () => {
    mocks.createIncident.mockResolvedValue({ id: "incident", reportedBy: { id: "reporter", name: "Synthetic", email: "synthetic@example.invalid", role: "Reporter", unitId: "unit", passwordHash: "synthetic-hash", googleId: "synthetic-google-id" } });
    const { POST } = await import("@/app/api/incidents/route");
    const response = await POST(request({}));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.reportedBy).toEqual({ id: "reporter", name: "[RESTRICTED]", email: "synthetic@example.invalid", role: "Reporter", unitId: "unit" });
    expect(JSON.stringify(body)).not.toContain("synthetic-hash");
  });
});

describe("workflow cache refresh", () => {
  it("invalidates a committed action update even if the incident update fails", async () => {
    mocks.incidentUpdate.mockRejectedValueOnce(new Error("incident update failed"));
    const { PUT } = await import("@/app/api/actions/[id]/route");
    expect((await PUT(request({ status: "Done" }, "PUT"), context)).status).toBe(500);
    expect(mocks.actionUpdate).toHaveBeenCalled();
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });

  it("does not invalidate RCA cache when its transaction fails", async () => {
    mocks.incidentUpdate.mockRejectedValueOnce(new Error("incident update failed"));
    const { PUT } = await import("@/app/api/incidents/[id]/rca/route");
    expect((await PUT(request({ ...rcaInput, submit: true }, "PUT"), context)).status).toBe(500);
    expect(mocks.rcaWrite).toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.transaction.mock.calls[0][0]).toHaveLength(2);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("invalidates after triage", async () => {
    const { POST } = await import("@/app/api/incidents/[id]/triage/route");
    expect((await POST(request({ ...classification, requireRca: true }), context)).status).toBe(200);
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it.each([true, false])("invalidates after RCA decision approved=%s", async (approved) => {
    mocks.incidentFind.mockResolvedValue(incident({ status: "RCASubmitted", rca: { status: "Submitted" } }));
    const { POST } = await import("@/app/api/incidents/[id]/rca/approve/route");
    expect((await POST(request({ approved }), context)).status).toBe(200);
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it("invalidates after creating an action", async () => {
    mocks.requireUser.mockResolvedValue({ id: "admin", role: "Admin", unitId: "unit" });
    mocks.incidentFind.mockResolvedValue(incident({ status: "ActionOngoing", rca: { id: "rca", status: "Approved" } }));
    const { POST } = await import("@/app/api/incidents/[id]/actions/route");
    expect((await POST(request({ title: "Follow up", ownerId: "reporter", dueDate: "2026-11-01" }), context)).status).toBe(201);
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it("invalidates after the owner marks an action Done", async () => {
    mocks.requireUser.mockResolvedValue({ id: "reporter", role: "Reporter", unitId: "unit" });
    const { PUT } = await import("@/app/api/actions/[id]/route");
    expect((await PUT(request({ status: "Done" }, "PUT"), context)).status).toBe(200);
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it.each([true, false])("invalidates after verification verified=%s", async (verified) => {
    mocks.actionFind.mockResolvedValue({ id: "action", status: "Done", incidentId: "incident", incident: incident({ status: "WaitingVerification" }) });
    const { POST } = await import("@/app/api/actions/[id]/verify/route");
    expect((await POST(request({ verified }), context)).status).toBe(200);
    expect(mocks.invalidate).toHaveBeenCalledOnce();
    if (verified) expect(mocks.actionUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "Verified", verifiedById: "reporter", verifiedAt: expect.any(Date) }) }));
  });
});

describe("second audit lifecycle and RCA regressions", () => {
  it.each([{ status: "Rejected" }, { status: "Closed" }, { deletedAt: new Date() }, { lifecycleStatus: "ARCHIVED" }])("blocks action writes for terminal lifecycle %j", async (override) => {
    const state = incident({ status: "ActionOngoing", rca: { status: "Approved" }, ...override });
    mocks.requireUser.mockResolvedValue({ id: "admin", role: "Admin", unitId: "unit" });
    mocks.incidentFind.mockResolvedValue(state);
    mocks.actionFind.mockResolvedValue({ id: "action", status: "Done", incidentId: "incident", incident: state });
    const update = await import("@/app/api/actions/[id]/route");
    const verify = await import("@/app/api/actions/[id]/verify/route");
    const create = await import("@/app/api/incidents/[id]/actions/route");
    expect((await update.PUT(request({ status: "Done" }, "PUT"), context)).status).toBe(409);
    expect((await verify.POST(request({ verified: true }), context)).status).toBe(409);
    expect((await create.POST(request({ title: "Follow up", ownerId: "reporter", dueDate: "2026-11-01" }), context)).status).toBe(409);
    expect(mocks.incidentUpdate).not.toHaveBeenCalled();
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
    expect(mocks.actionCreate).not.toHaveBeenCalled();
  });
  it.each(["3", "4", "5"])("keeps General severity %s in RCA workflow despite a false checkbox", async (severity) => {
    mocks.incidentFind.mockResolvedValue(incident({ clinicalOrGeneral: "General" }));
    mocks.riskFind.mockResolvedValue({ id: "risk", clinicalOrGeneral: "General", simpleCategory: "S" });
    const { POST } = await import("@/app/api/incidents/[id]/triage/route");
    expect((await POST(request({ ...classification, severity, requireRca: false }), context)).status).toBe(200);
    expect(mocks.incidentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "RCARequired" }) }));
  });
  it("does not write plaintext RCA factors alongside the ciphertext", async () => {
    const { PUT } = await import("@/app/api/incidents/[id]/rca/route");
    expect((await PUT(request({ ...rcaInput, individualStaffFactors: "Synthetic private narrative", submit: true }, "PUT"), context)).status).toBe(200);
    const call = mocks.rcaWrite.mock.calls[0][0];
    for (const data of [call.create, call.update]) {
      expect(data.rcaEncrypted).toBe("synthetic-ciphertext");
      for (const key of ["contributingHuman", "contributingProcess", "contributingEquipment", "contributingEnvironment", "contributingCommunication", "contributingIT"]) expect(data[key]).toBeNull();
    }
    expect(mocks.incidentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "RCASubmitted" } }));
  });
});
