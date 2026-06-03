import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { auditRecordHasSensitiveContent } from "@/lib/audit";
import { encryptedIncidentIdentifiers, encryptedRcaNarrative } from "@/lib/sensitive-fields";
import {
  classifyIncidentIdentifierCoverage,
  normalizeIdentifierValue,
  type IdentifierManifestRow,
} from "@/lib/sensitive-identifier-recovery";

type RecoveryManifest = {
  incidents: IdentifierManifestRow[];
};

function getManifestPath() {
  const flagIndex = process.argv.findIndex((arg) => arg === "--manifest");
  if (flagIndex === -1) return null;
  return process.argv[flagIndex + 1] ?? null;
}

function loadManifest() {
  const manifestPath = getManifestPath();
  if (!manifestPath) return null;
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as RecoveryManifest | IdentifierManifestRow[];
  const incidents = Array.isArray(parsed) ? parsed : parsed.incidents;
  return new Map((incidents ?? []).map((row) => [row.id, row]));
}

async function main() {
  const manifestByIncidentId = loadManifest();
  const incidents = await prisma.incident.findMany({
    include: { reportedBy: { select: { name: true } } },
  });

  let incidentCount = 0;
  let alreadySafeCount = 0;
  let noIdentifiersPresentCount = 0;
  const recoveryRequiredIds: string[] = [];

  for (const incidentRaw of incidents) {
    const incident = incidentRaw as typeof incidentRaw & {
      hnEncrypted?: string | null;
      anEncrypted?: string | null;
      reporterNameEncrypted?: string | null;
    };
    const expected = manifestByIncidentId?.get(incident.id);
    const status = classifyIncidentIdentifierCoverage(incident, expected);
    if (status === "recovery-required") {
      recoveryRequiredIds.push(incident.id);
      continue;
    }
    if (status === "already-safe") alreadySafeCount += 1;
    if (status === "no-identifiers-present") noIdentifiersPresentCount += 1;

    const shouldBackfillIdentifiers = status === "forward-backfill";
    const shouldBackfillReporterName = !incident.reporterNameEncrypted && !!normalizeIdentifierValue(incident.reportedBy?.name);

    if (!shouldBackfillIdentifiers && !shouldBackfillReporterName) {
      continue;
    }

    const encrypted = encryptedIncidentIdentifiers({
      patientHn: shouldBackfillIdentifiers ? incident.patientHn : undefined,
      patientAn: shouldBackfillIdentifiers ? incident.patientAn : undefined,
      reporterName: shouldBackfillReporterName ? incident.reportedBy?.name : undefined,
    });

    if (shouldBackfillIdentifiers && encrypted.hnEncrypted && incident.patientHn && decrypt(encrypted.hnEncrypted) !== incident.patientHn) {
      throw new Error(`HN encryption validation failed for incident ${incident.id}`);
    }
    if (shouldBackfillIdentifiers && encrypted.anEncrypted && incident.patientAn && decrypt(encrypted.anEncrypted) !== incident.patientAn) {
      throw new Error(`AN encryption validation failed for incident ${incident.id}`);
    }

    await prisma.incident.update({
      where: { id: incident.id },
      data: {
        ...(shouldBackfillIdentifiers ? {
          patientHn: null,
          patientAn: null,
          hnEncrypted: encrypted.hnEncrypted,
          anEncrypted: encrypted.anEncrypted,
        } : {}),
        ...(shouldBackfillReporterName ? { reporterNameEncrypted: encrypted.reporterNameEncrypted } : {}),
      } as any,
    });
    incidentCount += 1;
  }

  const rcas = await prisma.rCA.findMany();
  let rcaCount = 0;
  for (const rcaRaw of rcas) {
    const rca = rcaRaw as typeof rcaRaw & { rcaEncrypted?: string | null };
    const nextEncrypted = encryptedRcaNarrative({
      problemStatement: rca.problemStatement,
      timeline: rca.timeline,
      rootCause: rca.rootCause,
      preventiveAction: rca.preventiveAction,
    });
    if (!rca.rcaEncrypted || rca.problemStatement || rca.timeline || rca.rootCause || rca.preventiveAction) {
      await prisma.rCA.update({
        where: { id: rca.id },
        data: {
          rcaEncrypted: nextEncrypted,
          problemStatement: null,
          timeline: null,
          rootCause: null,
          preventiveAction: null,
        } as any,
      });
      rcaCount += 1;
    }
  }

  const remainingPlaintext = await prisma.incident.findMany({
    where: {
      OR: [{ patientHn: { not: null } }, { patientAn: { not: null } }],
    } as any,
    select: { id: true, patientHn: true, patientAn: true },
  });

  const auditRows = await prisma.auditLog.findMany({
    where: {
      OR: [{ oldValue: { not: null } }, { newValue: { not: null } }],
    },
    select: { id: true, oldValue: true, newValue: true },
    take: 1000,
  });
  const auditSensitiveHits = auditRows.filter((row) => auditRecordHasSensitiveContent(row.oldValue) || auditRecordHasSensitiveContent(row.newValue));

  console.log(JSON.stringify({
    updatedIncidents: incidentCount,
    updatedRcas: rcaCount,
    alreadySafeIncidents: alreadySafeCount,
    noIdentifiersPresentIncidents: noIdentifiersPresentCount,
    recoveryRequiredIncidents: recoveryRequiredIds.length,
    residualPlaintextIncidents: remainingPlaintext.length,
    auditSensitiveHits: auditSensitiveHits.length,
    manifestMode: manifestByIncidentId ? "backup-recovery-aware" : "forward-backfill-only",
  }, null, 2));

  if (recoveryRequiredIds.length > 0) {
    console.error("Recovery manifest indicates missing encrypted identifiers for incidents:", recoveryRequiredIds);
    process.exit(1);
  }

  if (remainingPlaintext.length > 0) {
    console.error("Residual plaintext patient identifiers remain:", remainingPlaintext.map((item) => item.id));
    process.exit(1);
  }

  if (!manifestByIncidentId) {
    console.warn("No recovery manifest supplied. Forward backfill completed, but legacy data-loss verification against backup was not performed.");
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
