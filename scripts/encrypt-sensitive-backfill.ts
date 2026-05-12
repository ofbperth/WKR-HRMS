import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { encryptedIncidentIdentifiers, encryptedRcaNarrative } from "@/lib/sensitive-fields";

async function main() {
  const incidents = await prisma.incident.findMany({
    include: { reportedBy: { select: { name: true } } },
  });

  let incidentCount = 0;
  for (const incidentRaw of incidents) {
    const incident = incidentRaw as typeof incidentRaw & {
      hnEncrypted?: string | null;
      anEncrypted?: string | null;
      reporterNameEncrypted?: string | null;
    };
    if (incident.hnEncrypted && incident.anEncrypted && incident.reporterNameEncrypted) continue;
    const encrypted = encryptedIncidentIdentifiers({
      patientHn: incident.patientHn,
      patientAn: incident.patientAn,
      reporterName: incident.reportedBy.name,
    });
    if (encrypted.hnEncrypted && decrypt(encrypted.hnEncrypted) !== incident.patientHn) {
      throw new Error(`HN encryption validation failed for incident ${incident.id}`);
    }
    if (encrypted.anEncrypted && decrypt(encrypted.anEncrypted) !== incident.patientAn) {
      throw new Error(`AN encryption validation failed for incident ${incident.id}`);
    }
    await prisma.incident.update({ where: { id: incident.id }, data: encrypted as any });
    incidentCount += 1;
  }

  const rcas = await prisma.rCA.findMany();
  let rcaCount = 0;
  for (const rcaRaw of rcas) {
    const rca = rcaRaw as typeof rcaRaw & { rcaEncrypted?: string | null };
    if (rca.rcaEncrypted) continue;
    await prisma.rCA.update({
      where: { id: rca.id },
      data: {
        rcaEncrypted: encryptedRcaNarrative({
          problemStatement: rca.problemStatement,
          timeline: rca.timeline,
          rootCause: rca.rootCause,
          preventiveAction: rca.preventiveAction,
        }),
      } as any,
    });
    rcaCount += 1;
  }

  console.log(`Encrypted sensitive fields for ${incidentCount} incidents and ${rcaCount} RCA records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
