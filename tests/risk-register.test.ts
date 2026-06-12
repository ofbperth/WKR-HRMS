import { beforeEach, describe, expect, it, vi } from "vitest";

const auditLog = vi.fn();
const findUnique = vi.fn();
const findFirst = vi.fn();
const findMany = vi.fn();
const create = vi.fn();
const update = vi.fn();
const createMany = vi.fn();
const deleteMany = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/audit", () => ({
  auditLog,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    riskRegister: {
      findUnique,
      findFirst,
      findMany,
      create,
      update,
    },
    incident: {
      findFirst,
    },
    riskIncidentLink: {
      findMany,
      createMany,
      deleteMany,
    },
    $transaction: transaction,
  },
}));

describe("risk register core logic", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("calculates risk score and level bands", async () => {
    const { calculateRiskScore, riskLevelFromScore } = await import("@/lib/risk-register");
    expect(calculateRiskScore(1, 4)).toBe(4);
    expect(riskLevelFromScore(4)).toBe("Low");
    expect(riskLevelFromScore(9)).toBe("Moderate");
    expect(riskLevelFromScore(16)).toBe("High");
    expect(riskLevelFromScore(25)).toBe("Extreme");
  });

  it("keeps unit-manager permissions narrower than RM/Admin", async () => {
    const { canUserViewRisk, canUserEditRisk, canUserLinkRiskIncident } = await import("@/lib/risk-register");
    const unitManager = { id: "u1", role: "UnitManager" as const, unitId: "unit-a" };
    const executive = { id: "u2", role: "Executive" as const, unitId: null };
    const rm = { id: "u3", role: "RMTeam" as const, unitId: null };

    expect(canUserViewRisk(unitManager, { scope: "UNIT", ownerUnitId: "unit-a" })).toBe(true);
    expect(canUserViewRisk(unitManager, { scope: "UNIT", ownerUnitId: "unit-b" })).toBe(false);
    expect(canUserViewRisk(unitManager, { scope: "HOSPITAL", ownerUnitId: null })).toBe(true);
    expect(canUserViewRisk(executive, { scope: "HOSPITAL", ownerUnitId: null })).toBe(true);
    expect(canUserViewRisk(executive, { scope: "UNIT", ownerUnitId: "unit-a" })).toBe(false);
    expect(canUserEditRisk(unitManager, { scope: "UNIT", status: "PROPOSED", ownerUnitId: "unit-a" })).toBe(true);
    expect(canUserEditRisk(unitManager, { scope: "UNIT", status: "ACTIVE", ownerUnitId: "unit-a" })).toBe(false);
    expect(canUserEditRisk(rm, { scope: "HOSPITAL", status: "ACTIVE", ownerUnitId: null })).toBe(true);
    expect(
      canUserLinkRiskIncident(
        unitManager,
        { scope: "UNIT", status: "ACTIVE", ownerUnitId: "unit-a" },
        { incidentUnitId: "unit-a" },
      ),
    ).toBe(true);
    expect(
      canUserLinkRiskIncident(
        unitManager,
        { scope: "HOSPITAL", status: "ACTIVE", ownerUnitId: null },
        { incidentUnitId: "unit-a" },
      ),
    ).toBe(false);
  });

  it("creates a unit proposal for UnitManager with enforced scope/status", async () => {
    const { createRiskForUser } = await import("@/lib/risk-register");
    transaction.mockImplementation(async (callback: any) =>
      callback({
        riskRegister: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: "risk-1", ...data })),
        },
      }),
    );

    const created = await createRiskForUser(
      { id: "user-1", role: "UnitManager", unitId: "unit-a" },
      {
        title: "Medication handling drift",
        description: "Repeated medication handling drift found in the unit workflow.",
        riskType: "CLINICAL",
        inherentLikelihood: 3,
        inherentImpact: 4,
        residualLikelihood: 2,
        residualImpact: 3,
        controlEffectiveness: "PARTIAL",
        trend: "UNKNOWN",
        reviewFrequency: "QUARTERLY",
      },
    );

    expect(created.scope).toBe("UNIT");
    expect(created.status).toBe("PROPOSED");
    expect(created.ownerUnitId).toBe("unit-a");
    expect(created.createdById).toBe("user-1");
  });

  it("blocks UnitManager from creating hospital risk directly", async () => {
    const { createRiskForUser } = await import("@/lib/risk-register");
    await expect(
      createRiskForUser(
        { id: "user-1", role: "UnitManager", unitId: "unit-a" },
        {
          title: "Hospital risk attempt",
          description: "This should fail because UnitManager cannot create hospital risk directly.",
          scope: "HOSPITAL",
          status: "ACTIVE",
          riskType: "OPERATIONAL",
          inherentLikelihood: 3,
          inherentImpact: 4,
          residualLikelihood: 2,
          residualImpact: 3,
          controlEffectiveness: "PARTIAL",
          trend: "UNKNOWN",
          reviewFrequency: "QUARTERLY",
        },
      ),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps executive risk detail aggregate-only without incident narrative", async () => {
    const { getRiskDetailForUser } = await import("@/lib/risk-register");
    findUnique.mockResolvedValue({
      id: "risk-1",
      riskNo: "RISK-2026-0001",
      title: "Hospital medication theme",
      description: "Aggregate hospital medication theme",
      scope: "HOSPITAL",
      status: "ACTIVE",
      riskType: "CLINICAL",
      riskDomain: null,
      ownerUnitId: null,
      ownerTeamId: null,
      executiveSponsorId: null,
      createdById: "creator-1",
      approvedById: null,
      approvedAt: null,
      closedById: null,
      closedAt: null,
      inherentLikelihood: 4,
      inherentImpact: 4,
      residualLikelihood: 3,
      residualImpact: 3,
      controlEffectiveness: "PARTIAL",
      trend: "STABLE",
      reviewFrequency: "QUARTERLY",
      nextReviewAt: null,
      decisionRequired: true,
      decisionNote: "Committee follow-up",
      acceptedReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      incidentLinks: [
        {
          id: "link-1",
          incident: {
            id: "incident-1",
            incidentNo: "INC-1",
            title: "Patient-specific detail that should not render",
            severity: "I",
            status: "RCARequired",
            occurredAt: new Date(),
            isSentinel: true,
            simpleCategory: "M2",
            incidentUnitId: "unit-a",
            incidentUnit: { id: "unit-a", name: "ICU" },
            riskCode: { id: "rc-1", code: "CPM101", nameTh: "Medication", simpleCategory: "M2" },
            rca: { id: "rca-1", status: "Submitted", rootCause: "Sensitive RCA", preventiveAction: "Sensitive action" },
            actionPlans: [],
          },
        },
      ],
      reviews: [{ id: "review-1", summary: "Sensitive summary", reviewDate: new Date(), residualLikelihood: 2, residualImpact: 2, controlEffectiveness: "PARTIAL", trend: "STABLE" }],
    });

    const risk = await getRiskDetailForUser("risk-1", { id: "exec-1", role: "Executive", unitId: null });
    expect(risk?.aggregateOnly).toBe(true);
    expect(risk?.incidentLinks).toEqual([]);
    expect(risk?.reviews?.[0]?.summary).toBeUndefined();
  });

  it("prevents duplicate many-to-many links", async () => {
    const { linkIncidentsToRiskForUser } = await import("@/lib/risk-register");
    findUnique.mockResolvedValue({ id: "risk-1", scope: "UNIT", status: "ACTIVE", ownerUnitId: "unit-a" });
    findFirst.mockResolvedValue({ id: "incident-1", incidentUnitId: "unit-a", incidentNo: "INC-1", title: "Incident title" });
    findMany.mockResolvedValue([{ incidentId: "incident-1" }]);

    const result = await linkIncidentsToRiskForUser(
      { id: "user-1", role: "UnitManager", unitId: "unit-a" },
      "risk-1",
      ["incident-1"],
    );

    expect(result?.linkedCount).toBe(0);
    expect(result?.duplicateIncidentIds).toEqual(["incident-1"]);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("moves links and rejects source proposal during merge", async () => {
    const { mergeRiskProposalForUser } = await import("@/lib/risk-register");
    findUnique
      .mockResolvedValueOnce({
        id: "risk-source",
        scope: "UNIT",
        status: "PROPOSED",
        ownerUnitId: "unit-a",
        incidentLinks: [{ incidentId: "incident-1", note: "link note" }, { incidentId: "incident-2", note: null }],
      })
      .mockResolvedValueOnce({
        id: "risk-target",
        riskNo: "RISK-2026-0009",
        scope: "HOSPITAL",
        status: "ACTIVE",
      });
    transaction.mockImplementation(async (callback: any) =>
      callback({
        riskIncidentLink: { createMany, deleteMany },
        riskRegister: {
          update: vi.fn().mockImplementation(async ({ data }: any) => ({ id: "risk-source", ...data })),
        },
      }),
    );

    const updated = await mergeRiskProposalForUser(
      { id: "rm-1", role: "RMTeam", unitId: null },
      "risk-source",
      "risk-target",
      "duplicate theme",
    );

    expect(createMany).toHaveBeenCalledOnce();
    expect(deleteMany).toHaveBeenCalledOnce();
    expect(updated?.status).toBe("REJECTED");
    expect(updated?.decisionNote).toContain("merged into RISK-2026-0009");
  });

  it("aggregates linked incidents into risk metrics", async () => {
    const { aggregateRiskIncidents } = await import("@/lib/risk-register");
    const aggregate = aggregateRiskIncidents([
      {
        incident: {
          occurredAt: new Date(),
          severity: "I",
          status: "RCARequired",
          isSentinel: true,
          simpleCategory: "M2",
          incidentUnit: { name: "ICU" },
          riskCode: { code: "CPM101", simpleCategory: "M2" },
          rca: { status: "Submitted" },
          actionPlans: [
            { status: "Ongoing", dueDate: new Date("2026-01-01T00:00:00.000Z") },
            { status: "Verified", dueDate: new Date("2026-01-02T00:00:00.000Z") },
          ],
        },
      },
      {
        incident: {
          occurredAt: new Date(),
          severity: "B",
          status: "UnderReview",
          isSentinel: false,
          simpleCategory: "M2",
          incidentUnit: { name: "Ward A" },
          riskCode: { code: "CPM101", simpleCategory: "M2" },
          rca: null,
          actionPlans: [{ status: "NotStarted", dueDate: new Date("2026-01-03T00:00:00.000Z") }],
        },
      },
    ]);

    expect(aggregate.linkedIncidentCount).toBe(2);
    expect(aggregate.highSeverityCount).toBe(1);
    expect(aggregate.sentinelCount).toBe(1);
    expect(aggregate.openRcaCount).toBe(1);
    expect(aggregate.openActionCount).toBe(2);
    expect(aggregate.overdueActionCount).toBeGreaterThanOrEqual(1);
    expect(aggregate.nrlsBreakdown[0]).toEqual({ key: "CPM101", count: 2 });
    expect(aggregate.simpleBreakdown[0]).toEqual({ key: "M2", count: 2 });
  });
});
