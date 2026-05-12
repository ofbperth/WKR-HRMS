import { runRetentionCleanup } from "@/lib/retention";
import { prisma } from "@/lib/prisma";

runRetentionCleanup({ role: "system", name: "retention-cli" })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
