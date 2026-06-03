import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
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
  const missingCoverage: Array<{ id: string; missing: string[] }> = [];

  for (const row of manifest) {
    const expectedHn = normalizeIdentifierValue(row.patientHn);
    const expectedAn = normalizeIdentifierValue(row.patientAn);
    if (!expectedHn && !expectedAn) continue;

    const incident = await prisma.incident.findUnique({
      where: { id: row.id },
      select: {
        id: true,
        hnEncrypted: true,
        anEncrypted: true,
      } as any,
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

  console.log(JSON.stringify({
    checked: manifest.length,
    missingCoverage,
  }, null, 2));

  if (missingCoverage.length > 0) {
    console.error("Recovery verification failed for incidents:", missingCoverage.map((item) => item.id));
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
