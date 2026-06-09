import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { encryptedIncidentIdentifiers } from "@/lib/sensitive-fields";
import { normalizeIdentifierValue, type IdentifierManifestRow } from "@/lib/sensitive-identifier-recovery";

type RecoveryManifest = {
  incidents: IdentifierManifestRow[];
};

function getInputPath() {
  const flagIndex = process.argv.findIndex((arg) => arg === "--input");
  const inputPath = flagIndex === -1 ? null : process.argv[flagIndex + 1] ?? null;
  if (!inputPath) throw new Error("MISSING_INPUT_MANIFEST");
  return inputPath;
}

function loadManifest() {
  const raw = JSON.parse(readFileSync(getInputPath(), "utf8")) as RecoveryManifest | IdentifierManifestRow[];
  const incidents = Array.isArray(raw) ? raw : raw.incidents;
  if (!incidents?.length) throw new Error("EMPTY_INPUT_MANIFEST");
  return incidents;
}

async function main() {
  const manifest = loadManifest();
  let updated = 0;
  const missingIncidents: string[] = [];

  for (const row of manifest) {
    const expectedHn = normalizeIdentifierValue(row.patientHn);
    const expectedAn = normalizeIdentifierValue(row.patientAn);
    if (!expectedHn && !expectedAn) continue;

    const incident = await prisma.incident.findUnique({
      where: { id: row.id },
      select: {
        id: true,
        patientHn: true,
        patientAn: true,
        hnEncrypted: true,
        anEncrypted: true,
      } as any,
    });
    if (!incident) {
      missingIncidents.push(row.id);
      continue;
    }

    const needsHnRecovery = !!expectedHn && !normalizeIdentifierValue((incident as any).hnEncrypted);
    const needsAnRecovery = !!expectedAn && !normalizeIdentifierValue((incident as any).anEncrypted);
    if (!needsHnRecovery && !needsAnRecovery) continue;

    const encrypted = encryptedIncidentIdentifiers({
      patientHn: expectedHn,
      patientAn: expectedAn,
    });
    if (needsHnRecovery && decrypt(encrypted.hnEncrypted) !== expectedHn) {
      throw new Error(`HN recovery validation failed for incident ${row.id}`);
    }
    if (needsAnRecovery && decrypt(encrypted.anEncrypted) !== expectedAn) {
      throw new Error(`AN recovery validation failed for incident ${row.id}`);
    }

    await prisma.incident.update({
      where: { id: row.id },
      data: {
        patientHn: null,
        patientAn: null,
        hnEncrypted: encrypted.hnEncrypted,
        anEncrypted: encrypted.anEncrypted,
      } as any,
    });
    updated += 1;
  }

  console.log(JSON.stringify({
    updated,
    missingIncidents,
  }, null, 2));

  if (missingIncidents.length > 0) {
    console.error("Recovery manifest rows were not found in the live database:", missingIncidents);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
