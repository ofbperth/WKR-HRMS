import { describe, expect, it } from "vitest";
import { assertIncidentDetailNoIdentifiers, detectPatientIdentifiers, IncidentDetailIdentifierError, validateIncidentDetailNoIdentifiers } from "@/lib/incident-detail-identifiers";

describe("incident detail identifier detection", () => {
  it("detects HN and AN patterns with safe positions", () => {
    const detections = detectPatientIdentifiers("พบข้อความ HN:123456 และ AN 660001 อยู่ในรายละเอียด");

    expect(detections.map((item) => item.category)).toEqual(["HN", "AN"]);
    expect(detections[0]).toMatchObject({ category: "HN", start: expect.any(Number), end: expect.any(Number) });
    expect(detections[1]).toMatchObject({ category: "AN", start: expect.any(Number), end: expect.any(Number) });
  });

  it("detects Thai citizen ID with optional spaces or hyphens", () => {
    const result = validateIncidentDetailNoIdentifiers("เอกสารถูกกรอกเลขบัตร 1 2345 67890 12 3 ลงใน incident detail");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.categories).toContain("เลขบัตรประชาชน");
    }
  });

  it("detects phone numbers and email addresses", () => {
    const result = validateIncidentDetailNoIdentifiers("ให้ติดต่อผู้ป่วยที่ 081-234-5678 หรือ patient@example.com");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.categories).toContain("เบอร์โทรศัพท์");
      expect(result.categories).toContain("อีเมล");
    }
  });

  it("detects patient name markers", () => {
    const result = validateIncidentDetailNoIdentifiers("ผู้ป่วยชื่อ สมใจ แจ้งว่าได้รับยาไม่ตรงเวลา");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.categories).toContain("ชื่อผู้ป่วย");
    }
  });

  it("detects Thai title plus name patterns", () => {
    const result = validateIncidentDetailNoIdentifiers("น.ส.กานดา มารับเอกสารผิดแฟ้มในช่วงเช้า");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.categories).toContain("ชื่อผู้ป่วย");
    }
  });

  it("allows normal incident detail without identifiers", () => {
    expect(validateIncidentDetailNoIdentifiers("ขณะเคลื่อนย้ายผู้ป่วย รถเข็นติดขอบเตียงทำให้ต้องหยุดตรวจสอบและแจ้งหัวหน้าเวรทันที")).toEqual({
      valid: true,
      message: null,
      categories: [],
      detections: [],
    });
  });

  it("throws a server-side blocking error for bypass attempts", () => {
    expect(() => assertIncidentDetailNoIdentifiers("passport AB1234567 ถูกใส่มาในรายละเอียด")).toThrow(IncidentDetailIdentifierError);
  });
});
