import "server-only";
import { decrypt, encryptToStorage } from "@/lib/encryption";

export function encryptedIncidentIdentifiers(input: {
  patientHn?: string | null;
  patientAn?: string | null;
  reporterName?: string | null;
}) {
  return {
    hnEncrypted: encryptToStorage(input.patientHn),
    anEncrypted: encryptToStorage(input.patientAn),
    reporterNameEncrypted: encryptToStorage(input.reporterName),
  };
}

export function decryptIncidentIdentifier(
  encryptedValue: string | null | undefined,
  plaintextFallback: string | null | undefined,
) {
  return decrypt(encryptedValue) ?? plaintextFallback ?? null;
}

export function encryptedRcaNarrative(input: {
  problemStatement?: string | null;
  timeline?: string | null;
  rootCause?: string | null;
  preventiveAction?: string | null;
}) {
  return encryptToStorage(JSON.stringify({
    problemStatement: input.problemStatement?.trim() || null,
    timeline: input.timeline?.trim() || null,
    rootCause: input.rootCause?.trim() || null,
    preventiveAction: input.preventiveAction?.trim() || null,
  }));
}
