import { prisma } from "@/lib/prisma";
import { auditRecordHasSensitiveContent, redactAuditValue } from "@/lib/audit";

function redactStoredAuditJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.stringify(redactAuditValue(JSON.parse(value)));
  } catch {
    return JSON.stringify(redactAuditValue(value));
  }
}

async function main() {
  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [{ oldValue: { not: null } }, { newValue: { not: null } }],
    },
    select: { id: true, oldValue: true, newValue: true },
    take: 2000,
  });

  let updated = 0;
  for (const row of rows) {
    if (!auditRecordHasSensitiveContent(row.oldValue) && !auditRecordHasSensitiveContent(row.newValue)) continue;
    await prisma.auditLog.update({
      where: { id: row.id },
      data: {
        oldValue: redactStoredAuditJson(row.oldValue),
        newValue: redactStoredAuditJson(row.newValue),
      },
    });
    updated += 1;
  }

  console.log(JSON.stringify({ scanned: rows.length, updated }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
