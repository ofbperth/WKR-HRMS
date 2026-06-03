import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import {
  classifyIncidentIdentifierCoverage,
  type IdentifierManifestRow,
} from "@/lib/sensitive-identifier-recovery";

type RecoveryManifest = {
  incidents: IdentifierManifestRow[];
};

const sampleSize = 20;

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
  return new Map(incidents.map((row) => [row.id, row]));
}

async function main() {
  const manifestByIncidentId = loadManifest();
  const incidents = await prisma.$queryRaw<Array<{
    id: string;
    patientHn: string | null;
    patientAn: string | null;
    hnEncrypted: string | null;
    anEncrypted: string | null;
  }>>`
    SELECT
      id,
      "patientHn",
      "patientAn",
      hn_encrypted AS "hnEncrypted",
      an_encrypted AS "anEncrypted"
    FROM "Incident"
  `;

  const report = {
    total: incidents.length,
    alreadySafe: [] as string[],
    forwardBackfill: [] as string[],
    recoveryRequired: [] as string[],
    noIdentifiersPresent: [] as string[],
    manifestMode: !!manifestByIncidentId,
  };

  for (const incident of incidents) {
    const status = classifyIncidentIdentifierCoverage(incident as any, manifestByIncidentId?.get(incident.id));
    if (status === "already-safe") report.alreadySafe.push(incident.id);
    if (status === "forward-backfill") report.forwardBackfill.push(incident.id);
    if (status === "recovery-required") report.recoveryRequired.push(incident.id);
    if (status === "no-identifiers-present") report.noIdentifiersPresent.push(incident.id);
  }

  console.log(JSON.stringify({
    total: report.total,
    alreadySafe: report.alreadySafe.length,
    forwardBackfill: report.forwardBackfill.length,
    recoveryRequired: report.recoveryRequired.length,
    noIdentifiersPresent: report.noIdentifiersPresent.length,
    sampleIds: {
      alreadySafe: report.alreadySafe.slice(0, sampleSize),
      forwardBackfill: report.forwardBackfill.slice(0, sampleSize),
      recoveryRequired: report.recoveryRequired.slice(0, sampleSize),
      noIdentifiersPresent: report.noIdentifiersPresent.slice(0, sampleSize),
    },
    moreThanSample: {
      alreadySafe: Math.max(0, report.alreadySafe.length - sampleSize),
      forwardBackfill: Math.max(0, report.forwardBackfill.length - sampleSize),
      recoveryRequired: Math.max(0, report.recoveryRequired.length - sampleSize),
      noIdentifiersPresent: Math.max(0, report.noIdentifiersPresent.length - sampleSize),
    },
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
