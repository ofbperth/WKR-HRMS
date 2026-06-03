import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { normalizeIdentifierValue, type IdentifierManifestRow } from "@/lib/sensitive-identifier-recovery";

type RecoveryManifest = {
  incidents: IdentifierManifestRow[];
};

function getInputPath() {
  const flagIndex = process.argv.findIndex((arg) => arg === "--input");
  return flagIndex === -1 ? null : process.argv[flagIndex + 1] ?? null;
}

function loadManifest() {
  const inputPath = getInputPath();
  if (!inputPath) return null;
  const raw = JSON.parse(readFileSync(inputPath, "utf8")) as RecoveryManifest | IdentifierManifestRow[];
  const incidents = Array.isArray(raw) ? raw : raw.incidents;
  if (!incidents?.length) throw new Error("EMPTY_INPUT_MANIFEST");
  return incidents;
}

async function main() {
  const manifest = loadManifest();
  const remainingPlaintext = await prisma.incident.findMany({
    where: {
      OR: [{ patientHn: { not: null } }, { patientAn: { not: null } }],
    } as any,
    select: { id: true, patientHn: true, patientAn: true },
  });
  if (remainingPlaintext.length > 0) {
    console.error("Cannot enforce null-only plaintext constraint while plaintext identifiers remain:", remainingPlaintext.map((item) => item.id));
    process.exit(1);
  }

  if (manifest) {
    const missingCoverage: Array<{ id: string; missing: string[] }> = [];
    for (const row of manifest) {
      const expectedHn = normalizeIdentifierValue(row.patientHn);
      const expectedAn = normalizeIdentifierValue(row.patientAn);
      if (!expectedHn && !expectedAn) continue;

      const incident = await prisma.incident.findUnique({
        where: { id: row.id },
        select: { id: true, hnEncrypted: true, anEncrypted: true } as any,
      });
      if (!incident) {
        missingCoverage.push({ id: row.id, missing: ["incident"] });
        continue;
      }

      const missing: string[] = [];
      if (expectedHn && !normalizeIdentifierValue((incident as any).hnEncrypted)) missing.push("hnEncrypted");
      if (expectedAn && !normalizeIdentifierValue((incident as any).anEncrypted)) missing.push("anEncrypted");
      if (missing.length > 0) missingCoverage.push({ id: row.id, missing });
    }

    if (missingCoverage.length > 0) {
      console.error("Cannot enforce constraint because recovery coverage is incomplete:", missingCoverage.map((item) => item.id));
      process.exit(1);
    }
  }

  const existing = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'Incident'
      AND constraint_type = 'CHECK'
      AND constraint_name = 'incident_plaintext_identifiers_must_be_null'
  `;
  if (existing.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Incident"
      ADD CONSTRAINT "incident_plaintext_identifiers_must_be_null"
      CHECK ("patientHn" IS NULL AND "patientAn" IS NULL)
    `);
  }

  console.log(JSON.stringify({
    enforced: true,
    manifestVerified: !!manifest,
    constraintAlreadyPresent: existing.length > 0,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
