import { describe, expect, it } from "vitest";
import { buildGeminiRcaPrompt, shouldShowAiRcaAssistant } from "@/lib/ai-rca-assistant";

describe("AI RCA Assistant", () => {
  it("shows for authorized roles only", () => {
    expect(shouldShowAiRcaAssistant("RMTeam")).toBe(true);
    expect(shouldShowAiRcaAssistant("UnitManager")).toBe(true);
    expect(shouldShowAiRcaAssistant("Admin")).toBe(true);
    expect(shouldShowAiRcaAssistant("Reporter")).toBe(false);
  });

  it("builds a de-identified prompt with a real summary and without the removed checklist block", () => {
    const prompt = buildGeminiRcaPrompt({
      id: "incident-internal-123",
      occurredAt: new Date("2026-06-10T08:15:00.000Z"),
      incidentUnit: { name: "ICU" },
      riskCode: { code: "CPE402" },
      clinicalOrGeneral: "Clinical",
      simpleCategory: "Communication",
      severity: "G",
      status: "RCARequired",
      description: "HN 1234567 นายสมชาย ใจดี โทร 0812345678 ผู้ป่วยได้รับยาผิดช่วงเวลา",
      immediateAction: "โทรหา นางสาวพยาบาลเอ และอ้าง AN 998877 เพื่อหยุดยา",
      rca: {
        status: "Draft",
        contributingHuman: "เจ้าหน้าที่ชื่อแดง handoff ไม่ครบ",
        contributingProcess: "กระบวนการ handoff ไม่ชัด",
        contributingEquipment: "",
        contributingEnvironment: null,
        contributingCommunication: "ติดต่อคุณสมหญิงไม่ทัน",
        contributingIT: "",
      },
    });

    expect(prompt).toContain("Case ID: incident-internal-123");
    expect(prompt).toContain("Brief summary:");
    expect(prompt).toContain("NRLS CPE402");
    expect(prompt).toContain("ผู้ป่วยได้รับยาผิดช่วงเวลา");
    expect(prompt).toContain("Immediate action:");
    expect(prompt).toContain("AN [REDACTED]");
    expect(prompt).toContain("Known contributing factors: Personnel:");
    expect(prompt).not.toContain("กรุณาวิเคราะห์ให้ครบหัวข้อดังนี้");
    expect(prompt).not.toContain("1. Timeline analysis");
    expect(prompt).not.toContain("12. Risk of recurrence");
    expect(prompt).not.toContain("1234567");
    expect(prompt).not.toContain("998877");
    expect(prompt).not.toContain("0812345678");
    expect(prompt).not.toContain("สมชาย");
    expect(prompt).not.toContain("สมหญิง");
    expect(prompt).not.toContain("พยาบาลเอ");
  });
});
