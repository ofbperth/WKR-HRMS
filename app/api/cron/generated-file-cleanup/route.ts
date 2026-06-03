import { auditLog } from "@/lib/audit";
import { cleanupExpiredGeneratedFiles } from "@/lib/export-jobs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await cleanupExpiredGeneratedFiles();
  await auditLog({
    action: "GENERATED_FILE_CLEANUP",
    entityType: "StorageObject",
    newValue: result,
  });
  return Response.json(result);
}
