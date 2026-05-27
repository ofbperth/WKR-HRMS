import { describe, expect, it } from "vitest";
import { createIncidentSchema, rcaSchema } from "@/lib/validators";

const validIncident = {
  occurredDate: "2026-05-12",
  occurredTime: "09:30",
  incidentUnitId: "unit-1",
  location: "Ward 1",
  affectedType: "Patient",
  title: "Medication delay",
  description: "Medication was delayed and immediate monitoring was started.",
  immediateAction: "Patient was assessed and doctor was informed.",
  clinicalOrGeneral: "Clinical",
  simpleCategory: "M2",
  riskCodeId: "risk-1",
  severity: "C",
  needRmSupport: false,
};

describe("incident and RCA validation", () => {
  it("accepts a complete incident submission payload", () => {
    expect(createIncidentSchema.safeParse(validIncident).success).toBe(true);
  });

  it("does not require SIMPLE category from the reporter payload", () => {
    const payload: Partial<typeof validIncident> = { ...validIncident };
    delete payload.simpleCategory;
    expect(createIncidentSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects likely patient names in narrative fields for PDPA readiness", () => {
    const result = createIncidentSchema.safeParse({ ...validIncident, description: "Mr Somchai received the wrong medication." });
    expect(result.success).toBe(false);
  });

  it("requires RCA root cause, preventive action, KPI owner, and RM support fields when present", () => {
    const result = rcaSchema.safeParse({
      problemStatement: "High severity fall",
      rootCause: "No handoff checkpoint",
      preventiveAction: "Add shift handoff checklist",
      kpi: "Checklist completion 95%",
      kpiOwnerId: "user-1",
      needRmSupport: true,
      submit: true,
    });
    expect(result.success).toBe(true);
  });
});
