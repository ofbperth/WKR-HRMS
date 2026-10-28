import { decryptRcaNarrative, encryptedRcaNarrative, buildSensitiveRcaNarrative } from "@/lib/sensitive-fields";
import { mapLegacyRcaToFiveTier } from "@/lib/rca-contributory-factors";

export const legacyRcaNarrativeKeys = ["problemStatement", "timeline", "rootCause", "preventiveAction", "contributingHuman", "contributingProcess", "contributingEquipment", "contributingEnvironment", "contributingCommunication", "contributingIT"] as const;
type LegacyRow = Partial<Record<typeof legacyRcaNarrativeKeys[number], string | null>> & { rcaEncrypted?: string | null };

export function prepareRcaStorageMigration(row: LegacyRow) {
  if (!legacyRcaNarrativeKeys.some(key => row[key] != null)) return null;
  const current = decryptRcaNarrative(row.rcaEncrypted);
  if (row.rcaEncrypted && !current) throw new Error("RCA_CIPHERTEXT_INVALID");
  const factors = mapLegacyRcaToFiveTier({ ...row, ...current });
  const narrative = buildSensitiveRcaNarrative({
    ...factors,
    problemStatement: current?.problemStatement ?? row.problemStatement,
    timeline: current?.timeline ?? row.timeline,
    rootCause: current?.rootCause ?? row.rootCause,
    preventiveAction: current?.preventiveAction ?? row.preventiveAction,
  });
  const rcaEncrypted = encryptedRcaNarrative(narrative);
  if (JSON.stringify(decryptRcaNarrative(rcaEncrypted)) !== JSON.stringify(narrative)) throw new Error("RCA_ENCRYPTION_VERIFICATION_FAILED");
  return { rcaEncrypted, ...Object.fromEntries(legacyRcaNarrativeKeys.map(key => [key, null])) };
}
