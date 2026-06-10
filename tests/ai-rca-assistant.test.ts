import { describe, expect, it } from "vitest";
import { buildGeminiRcaPrompt, MANUAL_DEIDENTIFY_NOTICE, shouldShowAiRcaAssistant } from "@/lib/ai-rca-assistant";

describe("AI RCA Assistant", () => {
  it("shows only on RCA detail paths for authorized roles", () => {
    expect(shouldShowAiRcaAssistant("RMTeam")).toBe(true);
    expect(shouldShowAiRcaAssistant("UnitManager")).toBe(true);
    expect(shouldShowAiRcaAssistant("Admin")).toBe(true);
    expect(shouldShowAiRcaAssistant("Reporter")).toBe(false);
  });

  it("builds a de-identified prompt without leaking direct identifiers from narrative fields", () => {
    const prompt = buildGeminiRcaPrompt({
      id: "incident-internal-123",
      occurredAt: new Date("2026-06-10T08:15:00.000Z"),
      incidentUnit: { name: "ICU" },
      riskCode: { code: "CPE402" },
      clinicalOrGeneral: "Clinical",
      simpleCategory: "Communication",
      severity: "G",
      status: "RCARequired",
      description: "HN 1234567 นายสมชาย ใจดี โทร 0812345678",
      immediateAction: "โทรหา นางสาวพยาบาลเอ และอ้าง AN 998877",
      rca: {
        status: "Draft",
        contributingHuman: "เจ้าหน้าที่ชื่อแดง",
        contributingProcess: "กระบวนการ handoff ไม่ชัด",
        contributingEquipment: "",
        contributingEnvironment: null,
        contributingCommunication: "ติดต่อคุณสมหญิง",
        contributingIT: "",
      },
    });

    expect(prompt).toContain("Case ID: incident-internal-123");
    expect(prompt).toContain(`Brief summary: ${MANUAL_DEIDENTIFY_NOTICE}`);
    expect(prompt).toContain(`Immediate action: ${MANUAL_DEIDENTIFY_NOTICE}`);
    expect(prompt).toContain(`Known contributing factors: Personnel: ${MANUAL_DEIDENTIFY_NOTICE}; Process: ${MANUAL_DEIDENTIFY_NOTICE}; Communication: ${MANUAL_DEIDENTIFY_NOTICE}`);
    expect(prompt).not.toContain("1234567");
    expect(prompt).not.toContain("998877");
    expect(prompt).not.toContain("0812345678");
    expect(prompt).not.toContain("สมชาย");
    expect(prompt).not.toContain("สมหญิง");
    expect(prompt).not.toContain("พยาบาลเอ");
  });
});
