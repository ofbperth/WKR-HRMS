import { decrypt, encryptToStorage } from "@/lib/encryption";

// Data minimization: collect patient identifiers and RCA narrative only when
// needed for risk review, store encrypted copies, and expose plaintext only via
// role-limited server routes with audit logging.
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
) {
  return decrypt(encryptedValue) ?? null;
}

export function decryptLegacyIncidentIdentifier(
  encryptedValue: string | null | undefined,
  plaintextFallback: string | null | undefined,
) {
  return decrypt(encryptedValue) ?? plaintextFallback ?? null;
}

export type SensitiveRcaNarrativeInput = {
  problemStatement?: string | null;
  timeline?: string | null;
  rootCause?: string | null;
  preventiveAction?: string | null;
};

export function buildSensitiveRcaNarrative(input: SensitiveRcaNarrativeInput) {
  return {
    problemStatement: input.problemStatement?.trim() || null,
    timeline: input.timeline?.trim() || null,
    rootCause: input.rootCause?.trim() || null,
    preventiveAction: input.preventiveAction?.trim() || null,
  };
}

export function encryptedRcaNarrative(input: SensitiveRcaNarrativeInput) {
  return encryptToStorage(JSON.stringify({
    ...buildSensitiveRcaNarrative(input),
  }));
}

export function decryptRcaNarrative(encryptedValue: string | null | undefined) {
  const value = decrypt(encryptedValue);
  if (!value) return null;
  try {
    return JSON.parse(value) as {
      problemStatement: string | null;
      timeline: string | null;
      rootCause: string | null;
      preventiveAction: string | null;
    };
  } catch {
    return null;
  }
}
