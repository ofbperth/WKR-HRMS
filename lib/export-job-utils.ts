import type { ExportJobStatus } from "@/lib/types";

export function resolveExportJobStatus(job: { status: string; expiresAt?: Date | string | null }) {
  if (job.status === "Succeeded" && job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) return "Expired" satisfies ExportJobStatus;
  if (job.status === "Expired") return "Expired" satisfies ExportJobStatus;
  if (job.status === "Queued" || job.status === "Running" || job.status === "Succeeded" || job.status === "Failed") return job.status satisfies ExportJobStatus;
  return "Failed" satisfies ExportJobStatus;
}
