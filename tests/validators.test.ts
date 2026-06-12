import { describe, expect, it } from "vitest";
import { actionUpdateSchema, commentSchema, createIncidentSchema, exportRequestSchema, reporterUpdateIncidentSchema, rcaSchema } from "@/lib/validators";
import { INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE } from "@/lib/incident-detail-identifiers";

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

  it("blocks incident detail when HN or AN is detected", () => {
    const hnResult = createIncidentSchema.safeParse({ ...validIncident, description: "พบเอกสาร HN:123456 ติดมากับใบสั่งยา" });
    const anResult = createIncidentSchema.safeParse({ ...validIncident, description: "ward โทรมาแจ้ง AN 660001 ผิดเตียง" });

    expect(hnResult.success).toBe(false);
    expect(anResult.success).toBe(false);
    if (!hnResult.success) {
      expect(hnResult.error.issues[0]?.message).toBe(INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE);
    }
  });

  it("blocks incident detail when Thai citizen ID, phone, or email is detected", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "แนบเลขบัตร 1-2345-67890-12-3 มาในข้อความ" }).success).toBe(false);
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "ญาติแจ้งให้ติดต่อกลับที่ 081-234-5678" }).success).toBe(false);
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "ให้ส่งผลตรวจไปที่ patient@example.com" }).success).toBe(false);
  });

  it("blocks incident detail when patient name markers or Thai title plus name are detected", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "ผู้ป่วยชื่อ สมชาย ใจดี มีอาการเวียนศีรษะหลังได้รับยา" }).success).toBe(false);
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "นางสาว สุดา ใจดี ได้รับเอกสารสลับแฟ้มก่อนเข้าห้องตรวจ" }).success).toBe(false);
  });

  it("keeps the rule scoped to incident detail only", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, title: "HN:123456", description: validIncident.description }).success).toBe(true);
    expect(createIncidentSchema.safeParse({ ...validIncident, immediateAction: "โทรกลับที่ 0812345678", description: validIncident.description }).success).toBe(true);
    expect(commentSchema.safeParse({ message: "เลขบัตร 1234567890123" }).success).toBe(true);
    expect(rcaSchema.safeParse({
      problemStatement: "AN: 7654321",
      rootCause: "Workflow gap",
      preventiveAction: "Add checklist",
      needRmSupport: false,
      submit: false,
    }).success).toBe(true);
    expect(actionUpdateSchema.safeParse({ status: "Done", evidenceText: "โทรหา 0812345678", evidenceUrl: null, kpiResult: null, effectivenessReview: null }).success).toBe(true);
  });

  it("allows normal incident detail without identifiers", () => {
    expect(createIncidentSchema.safeParse({ ...validIncident, description: "ขณะให้ยาเกิดความล่าช้า 15 นาทีเนื่องจากคิวตรวจซ้อนกัน จึงเฝ้าระวังอาการและแจ้งแพทย์ทันที" }).success).toBe(true);
  });

  it("client-side validation blocks submit through the create incident schema", () => {
    const result = createIncidentSchema.safeParse({ ...validIncident, description: "HN-123456 ถูกพิมพ์ไว้ในข้อความรายละเอียด" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toContain(INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE);
    }
  });

  it("server-side validation blocks update payloads through the reporter update schema", () => {
    const result = reporterUpdateIncidentSchema.safeParse({
      id: "incident-1",
      description: "ชื่อผู้ป่วย: Jane Doe Smith ถูกใส่มาใน incident detail",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toContain(INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE);
    }
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
