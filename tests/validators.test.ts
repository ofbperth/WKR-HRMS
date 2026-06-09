import { describe, expect, it } from "vitest";
import { actionUpdateSchema, commentSchema, createIncidentSchema, exportRequestSchema, rcaSchema } from "@/lib/validators";

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

  it("does not require HN or AN for incident submission", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, patientHn: "", patientAn: "" }).success).toBe(true);
    expect(createIncidentSchema.safeParse(validIncident).success).toBe(true);
  });

  it("does not treat MS Word as a patient name", () => {
    const result = createIncidentSchema.safeParse({ ...validIncident, immediateAction: "ให้ลงข้อมูลใน MS Word ระหว่างรอแก้ไขระบบ" });
    expect(result.success).toBe(true);
  });

  it("rejects likely patient names in narrative fields for PDPA readiness", () => {
    const result = createIncidentSchema.safeParse({ ...validIncident, description: "Mr Somchai received the wrong medication." });
    expect(result.success).toBe(false);
  });

  it("rejects HN, AN, CID, and phone-like identifiers in protected narrative fields", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "HN: 1234567 medication mismatch" }).success).toBe(false);
    expect(rcaSchema.safeParse({
      problemStatement: "AN: 7654321",
      rootCause: "Workflow gap",
      preventiveAction: "Add checklist",
      needRmSupport: false,
      submit: false,
    }).success).toBe(false);
    expect(commentSchema.safeParse({ message: "เลขบัตร 1234567890123" }).success).toBe(false);
    expect(actionUpdateSchema.safeParse({ status: "Done", evidenceText: "โทรหา 0812345678", evidenceUrl: null, kpiResult: null, effectivenessReview: null }).success).toBe(false);
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

  it("requires a meaningful export reason and preserves filters", () => {
    expect(exportRequestSchema.safeParse({
      reason: "too short",
      filters: { action: "VIEW_INCIDENT" },
    }).success).toBe(false);

    const result = exportRequestSchema.safeParse({
      reason: "Need audit evidence for monthly compliance review",
      filters: { action: "VIEW_INCIDENT", entityType: "Incident" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filters).toEqual({ action: "VIEW_INCIDENT", entityType: "Incident" });
    }
  });
});
