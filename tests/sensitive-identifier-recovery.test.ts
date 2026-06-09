import { describe, expect, it } from "vitest";
import { classifyIncidentIdentifierCoverage, normalizeIdentifierValue } from "@/lib/sensitive-identifier-recovery";

describe("sensitive identifier recovery", () => {
  it("classifies plaintext rows as forward backfill", () => {
    expect(classifyIncidentIdentifierCoverage({
      id: "incident-1",
      patientHn: "123456",
      patientAn: null,
      hnEncrypted: null,
      anEncrypted: null,
    })).toBe("forward-backfill");
  });

  it("classifies encrypted-only rows as already safe", () => {
    expect(classifyIncidentIdentifierCoverage({
      id: "incident-2",
      patientHn: null,
      patientAn: null,
      hnEncrypted: "ciphertext",
      anEncrypted: null,
    })).toBe("already-safe");
  });

  it("classifies manifest-backed missing identifiers as recovery required", () => {
    expect(classifyIncidentIdentifierCoverage({
      id: "incident-3",
      patientHn: null,
      patientAn: null,
      hnEncrypted: null,
      anEncrypted: null,
    }, {
      id: "incident-3",
      patientHn: "123456",
      patientAn: null,
    })).toBe("recovery-required");
  });

  it("keeps truly empty rows separate from recovery failures", () => {
    expect(classifyIncidentIdentifierCoverage({
      id: "incident-4",
      patientHn: null,
      patientAn: null,
      hnEncrypted: null,
      anEncrypted: null,
    })).toBe("no-identifiers-present");
    expect(normalizeIdentifierValue("   ")).toBeNull();
  });
});
