import { prisma } from "@/lib/prisma";
import { legacyRcaNarrativeKeys, prepareRcaStorageMigration } from "@/lib/rca-storage-migration";

async function main() {
  const apply = process.argv.includes("--apply");
  let cursor: string | undefined;
  let checked = 0, changed = 0;
  while (true) {
    const rows = await prisma.rCA.findMany({ orderBy: { id: "asc" }, take: 100, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    if (!rows.length) break;
    for (const row of rows) {
      const data = prepareRcaStorageMigration(row);
      checked += 1;
      if (!data) continue;
      if (apply) {
        // Compare the snapshot so a concurrent editor is never overwritten.
        const result = await prisma.rCA.updateMany({ where: { id: row.id, updatedAt: row.updatedAt, rcaEncrypted: row.rcaEncrypted, ...Object.fromEntries(legacyRcaNarrativeKeys.map(key => [key, row[key]])) }, data });
        if (result.count !== 1) throw new Error("RCA_CHANGED_RETRY_BACKFILL");
      }
      changed += 1;
    }
    cursor = rows[rows.length - 1].id;
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", checked, changed }));
}
main().catch(() => { console.error("RCA backfill failed; no narrative data logged. Check encryption configuration or concurrent updates before retrying."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
