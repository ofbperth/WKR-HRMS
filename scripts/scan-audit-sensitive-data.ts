import { prisma } from "@/lib/prisma";
import { scanAuditRecordForSensitiveData } from "@/lib/audit";

async function main() {
  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [{ oldValue: { not: null } }, { newValue: { not: null } }],
    },
    select: { id: true, oldValue: true, newValue: true, action: true, entityType: true, entityId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const flagged = rows
    .map((row) => ({ ...row, ...scanAuditRecordForSensitiveData(row) }))
    .filter((row) => row.hasSensitiveOldValue || row.hasSensitiveNewValue);

  console.log(JSON.stringify({
    scanned: rows.length,
    flagged: flagged.length,
    rows: flagged,
  }, null, 2));

  if (flagged.length > 0) {
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
