import { auditLog } from "@/lib/audit";
import { authorizeWorkerRequest, processQueuedExportJob } from "@/lib/export-jobs";

export async function POST(request: Request) {
  if (!(await authorizeWorkerRequest(request))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({} as { jobId?: string }));
  try {
    const job = await processQueuedExportJob(body.jobId);
    return Response.json({ processed: Boolean(job), jobId: job?.id ?? null, status: job?.status ?? null });
  } catch (error) {
    await auditLog({
      action: "EXPORT_WORKER_FAILED",
      entityType: "ExportJob",
      entityId: body.jobId ?? null,
      newValue: error instanceof Error ? { message: error.message } : undefined,
    });
    return Response.json({ error: "EXPORT_JOB_PROCESS_FAILED" }, { status: 500 });
  }
}
