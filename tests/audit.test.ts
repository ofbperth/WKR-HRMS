import { describe, expect, it } from "vitest";
import { redactAuditValue, scanAuditRecordForSensitiveData } from "@/lib/audit";

describe("audit redaction", () => {
  it("redacts sensitive keys and inline identifiers", () => {
    const result = redactAuditValue({
      patientHn: "1234567",
      message: "HN: 1234567 โทร 0812345678",
      nested: {
        rootCause: "ผู้ป่วยชื่อ สมชาย",
      },
    }) as any;

    expect(result.patientHn).toBe("[REDACTED]");
    expect(result.message).toContain("[REDACTED]");
    expect(result.nested.rootCause).toContain("[REDACTED]");
  });

  it("flags legacy audit rows with sensitive content", () => {
    const result = scanAuditRecordForSensitiveData({
      id: "audit-1",
      oldValue: "{\"message\":\"AN: 7654321\"}",
      newValue: "{\"message\":\"safe\"}",
    });
    expect(result.hasSensitiveOldValue).toBe(true);
    expect(result.hasSensitiveNewValue).toBe(false);
  });
});
