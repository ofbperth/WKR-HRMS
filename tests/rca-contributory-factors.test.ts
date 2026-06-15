import { describe, expect, it } from "vitest";
import { mapFiveTierToLegacyProjection, mapLegacyRcaToFiveTier } from "@/lib/rca-contributory-factors";

describe("RCA contributory factors mappers", () => {
  it("maps legacy RCA fields into the 5-tier structure with labeled merged sections", () => {
    const result = mapLegacyRcaToFiveTier({
      contributingHuman: "พยาบาลใหม่ยังไม่คุ้น flow",
      contributingProcess: "handover ไม่มี checklist",
      contributingEquipment: "monitor alarm ดังเบา",
      contributingEnvironment: "เวรดึก staffing ต่ำ",
      contributingCommunication: "escalation delay",
      contributingIT: "CPOE alert ไม่เด้ง",
    });

    expect(result).toEqual({
      patientFactors: "",
      individualStaffFactors: "พยาบาลใหม่ยังไม่คุ้น flow",
      taskProcessTechnologyFactors: "กระบวนการ:\nhandover ไม่มี checklist\n\nเครื่องมือ/อุปกรณ์:\nmonitor alarm ดังเบา\n\nIT:\nCPOE alert ไม่เด้ง",
      teamCommunicationFactors: "escalation delay",
      workEnvironmentOrganizationalFactors: "เวรดึก staffing ต่ำ",
    });
  });

  it("prefers existing 5-tier values when they are already present", () => {
    const result = mapLegacyRcaToFiveTier({
      patientFactors: "ผู้ป่วยอาการไม่คงที่",
      individualStaffFactors: "พยาบาลใหม่ยังไม่คุ้น flow",
      taskProcessTechnologyFactors: "workflow ไม่ชัด",
      teamCommunicationFactors: "handover ไม่ครบ",
      workEnvironmentOrganizationalFactors: "staffing ต่ำ",
      contributingHuman: "legacy human",
      contributingProcess: "legacy process",
    });

    expect(result).toEqual({
      patientFactors: "ผู้ป่วยอาการไม่คงที่",
      individualStaffFactors: "พยาบาลใหม่ยังไม่คุ้น flow",
      taskProcessTechnologyFactors: "workflow ไม่ชัด",
      teamCommunicationFactors: "handover ไม่ครบ",
      workEnvironmentOrganizationalFactors: "staffing ต่ำ",
    });
  });

  it("maps the 5-tier structure back to legacy compatibility fields", () => {
    const result = mapFiveTierToLegacyProjection({
      patientFactors: "ผู้ป่วยอาการไม่คงที่",
      individualStaffFactors: "พยาบาลใหม่ยังไม่คุ้น flow",
      taskProcessTechnologyFactors: "กระบวนการ:\nhandover ไม่มี checklist\n\nเครื่องมือ/อุปกรณ์:\nmonitor alarm ดังเบา\n\nIT:\nCPOE alert ไม่เด้ง",
      teamCommunicationFactors: "handover ไม่ครบ",
      workEnvironmentOrganizationalFactors: "staffing ต่ำ",
    });

    expect(result).toEqual({
      contributingHuman: "พยาบาลใหม่ยังไม่คุ้น flow",
      contributingProcess: "handover ไม่มี checklist",
      contributingEquipment: "monitor alarm ดังเบา",
      contributingEnvironment: "staffing ต่ำ",
      contributingCommunication: "handover ไม่ครบ",
      contributingIT: "CPOE alert ไม่เด้ง",
    });
  });

  it("falls back to the merged task/process/technology text when no labels are present", () => {
    const result = mapFiveTierToLegacyProjection({
      taskProcessTechnologyFactors: "workflow ไม่ชัดและ alert ไม่เด้ง",
    });

    expect(result).toEqual({
      contributingHuman: null,
      contributingProcess: "workflow ไม่ชัดและ alert ไม่เด้ง",
      contributingEquipment: null,
      contributingEnvironment: null,
      contributingCommunication: null,
      contributingIT: null,
    });
  });
});
