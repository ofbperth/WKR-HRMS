import { describe, expect, it } from "vitest";
import { prepareRcaStorageMigration, legacyRcaNarrativeKeys } from "@/lib/rca-storage-migration";
import { encryptedRcaNarrative, decryptRcaNarrative } from "@/lib/sensitive-fields";
describe("RCA encrypted storage migration", () => {
  it("preserves encrypted fields and legacy-only factors before clearing plaintext", () => {
    const rcaEncrypted = encryptedRcaNarrative({ problemStatement: "Existing encrypted problem", patientFactors: "Existing patient factor" });
    const result = prepareRcaStorageMigration({ rcaEncrypted, contributingHuman: "Staff factor", contributingProcess: "Process factor", contributingCommunication: "Team factor" })!;
    const decoded = decryptRcaNarrative(result.rcaEncrypted)!;
    expect(decoded.problemStatement).toBe("Existing encrypted problem"); expect(decoded.patientFactors).toBe("Existing patient factor");
    expect(decoded.individualStaffFactors).toBe("Staff factor"); expect(decoded.teamCommunicationFactors).toBe("Team factor");
    for (const key of legacyRcaNarrativeKeys) expect((result as Record<string, unknown>)[key]).toBeNull();
    expect(prepareRcaStorageMigration(result)).toBeNull();
  });
  it("refuses to clear legacy values when existing ciphertext cannot be decoded", () => { expect(() => prepareRcaStorageMigration({ rcaEncrypted: "invalid", contributingHuman: "Keep me" })).toThrow("RCA_CIPHERTEXT_INVALID"); });
});
