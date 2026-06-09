export type IdentifierManifestRow = {
  id: string;
  patientHn?: string | null;
  patientAn?: string | null;
};

export type IncidentIdentifierCoverageInput = {
  id: string;
  patientHn?: string | null;
  patientAn?: string | null;
  hnEncrypted?: string | null;
  anEncrypted?: string | null;
};

export type IncidentIdentifierCoverageStatus =
  | "already-safe"
  | "forward-backfill"
  | "no-identifiers-present"
  | "recovery-required";

export function normalizeIdentifierValue(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function classifyIncidentIdentifierCoverage(
  incident: IncidentIdentifierCoverageInput,
  expected?: IdentifierManifestRow,
): IncidentIdentifierCoverageStatus {
  const patientHn = normalizeIdentifierValue(incident.patientHn);
  const patientAn = normalizeIdentifierValue(incident.patientAn);
  const hnEncrypted = normalizeIdentifierValue(incident.hnEncrypted);
  const anEncrypted = normalizeIdentifierValue(incident.anEncrypted);
  const expectedHn = normalizeIdentifierValue(expected?.patientHn);
  const expectedAn = normalizeIdentifierValue(expected?.patientAn);

  if ((expectedHn && !patientHn && !hnEncrypted) || (expectedAn && !patientAn && !anEncrypted)) {
    return "recovery-required";
  }

  if (patientHn || patientAn) {
    return "forward-backfill";
  }

  if (hnEncrypted || anEncrypted) {
    return "already-safe";
  }

  return "no-identifiers-present";
}
