import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { assertExportScope, scopeForExport } from "@/lib/export-scope";
import { buildExport, type ExportArtifact } from "@/lib/export-builders";
import { resolveExportJobStatus } from "@/lib/export-job-utils";
import { createPrivateSignedDownloadUrl, deletePrivateObject, exportStorageBucket, uploadPrivateObject } from "@/lib/storage";
import { exportTtlSeconds } from "@/lib/signed-export";
import type { ExportKind, ExportJobStatus } from "@/lib/types";
import type { SignedExportFilters } from "@/lib/signed-export";

type ExportUser = { id: string; role: string; unitId: string | null; name?: string | null };

const exportRateLimitWindowMs = 30 * 60 * 1000;
const generatedObjectTypes = ["EXPORT_ARTIFACT", "MONTHLY_REPORT_ARTIFACT", "GENERATED_REPORT_ARTIFACT"] as const;

const exportRateLimitByRole: Record<string, number> = {
  Reporter: 3,
  UnitManager: 10,
  RMTeam: 20,
  Admin: 30,
};

function nowPlusHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function artifactTtlHours() {
  const parsed = Number(process.env.EXPORT_ARTIFACT_TTL_HOURS ?? "168");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 168;
}

function workerSecret() {
  const secret = process.env.EXPORT_JOB_WORKER_SECRET?.trim();
  if (!secret) throw new Error("EXPORT_JOB_WORKER_SECRET_REQUIRED");
  return secret;
}

function appBaseUrl(requestUrl?: string) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (!requestUrl) throw new Error("APP_BASE_URL_REQUIRED");
  return new URL(requestUrl).origin;
}

function parseFilters(filtersJson: string) {
  try {
    const parsed = JSON.parse(filtersJson);
    return parsed && typeof parsed === "object" ? parsed as SignedExportFilters : {};
  } catch {
    return {};
  }
}

async function assertExportRateLimitTx(tx: any, user: ExportUser) {
  const limit = exportRateLimitByRole[user.role] ?? 5;
  const windowStart = new Date(Date.now() - exportRateLimitWindowMs);
  await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1))", `export-job-rate-limit:${user.id}`);
  const recentCount = await tx.exportJob.count({
    where: {
      userId: user.id,
      requestedAt: { gte: windowStart },
    },
  });
  if (recentCount >= limit) throw new Error("EXPORT_RATE_LIMITED");
}

async function artifactToBytes(artifact: ExportArtifact) {
  const arrayBuffer = await new Response(artifact.body).arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function exportObjectKey(job: { kind: string; id: string; requestedAt: Date | string }, filename: string) {
  const requestedAt = new Date(job.requestedAt);
  const datePart = requestedAt.toISOString().slice(0, 10);
  return `exports/${job.kind}/${datePart}/${job.id}/${filename}`;
}

export async function createExportJob(input: {
  request: Request;
  kind: ExportKind;
  user: ExportUser;
  reason: string;
  filters?: SignedExportFilters;
}) {
  const filters = input.filters ?? {};
  assertExportScope(input.kind, input.user, filters);

  const expiresAt = nowPlusHours(artifactTtlHours());
  const scope = scopeForExport(input.kind, input.user, filters);
  const job = await prisma.$transaction(async (tx) => {
    await assertExportRateLimitTx(tx as any, input.user);
    return (tx as any).exportJob.create({
      data: {
        userId: input.user.id,
        kind: input.kind,
        role: input.user.role,
        unitId: input.user.unitId,
        reason: input.reason,
        scope,
        filtersJson: JSON.stringify(filters),
        status: "Queued",
        expiresAt,
      },
    });
  });

  await auditLog({
    userId: input.user.id,
    role: input.user.role,
    action: "EXPORT_JOB_CREATED",
    entityType: "ExportJob",
    entityId: job.id,
    newValue: {
      kind: input.kind,
      reason: input.reason,
      scope,
      expiresAt: expiresAt.toISOString(),
      filters,
    },
  });

  void queueExportJobProcessing({ requestUrl: input.request.url, jobId: job.id });
  return job;
}

export async function triggerExportWorker(input: { requestUrl?: string; jobId?: string }) {
  const baseUrl = appBaseUrl(input.requestUrl);
  const response = await fetch(`${baseUrl}/api/internal/export-jobs/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerSecret()}`,
    },
    body: JSON.stringify(input.jobId ? { jobId: input.jobId } : {}),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`EXPORT_WORKER_TRIGGER_FAILED:${response.status}`);
  }
}

async function queueExportJobProcessing(input: { requestUrl?: string; jobId: string }) {
  try {
    await triggerExportWorker(input);
    return;
  } catch (triggerError) {
    await auditLog({
      action: "EXPORT_WORKER_TRIGGER_FALLBACK",
      entityType: "ExportJob",
      entityId: input.jobId,
      newValue: triggerError instanceof Error ? { message: triggerError.message } : undefined,
    }).catch(() => undefined);
  }

  try {
    await processQueuedExportJob(input.jobId);
  } catch {
    // processQueuedExportJob already records failure details on the job itself.
  }
}

export async function claimExportJob(jobId?: string) {
  const where = jobId ? { id: jobId } : { status: "Queued" };
  const candidate = await (prisma as any).exportJob.findFirst({
    where,
    orderBy: { requestedAt: "asc" },
  });
  if (!candidate || candidate.status !== "Queued") return null;

  const result = await (prisma as any).exportJob.updateMany({
    where: { id: candidate.id, status: "Queued" },
    data: {
      status: "Running",
      startedAt: new Date(),
      finishedAt: null,
      lastError: null,
      attemptCount: { increment: 1 },
    },
  });
  if (result.count !== 1) return null;
  return (prisma as any).exportJob.findUnique({ where: { id: candidate.id } });
}

async function markJobFailed(job: any, error: unknown) {
  const message = error instanceof Error ? error.message : "EXPORT_JOB_FAILED";
  const updated = await (prisma as any).exportJob.update({
    where: { id: job.id },
    data: {
      status: "Failed",
      finishedAt: new Date(),
      lastError: message,
    },
  });
  await auditLog({
    userId: job.userId,
    role: job.role,
    action: "EXPORT_JOB_FAILED",
    entityType: "ExportJob",
    entityId: job.id,
    newValue: { kind: job.kind, error: message, attemptCount: updated.attemptCount },
  });
  return updated;
}

async function attachArtifactMetadata(job: any, artifact: ExportArtifact) {
  const expiresAt = nowPlusHours(artifactTtlHours());
  const bytes = await artifactToBytes(artifact);
  const objectKey = exportObjectKey(job, artifact.filename);
  const uploaded = await uploadPrivateObject({
    bucket: exportStorageBucket(),
    objectKey,
    contentType: artifact.contentType,
    body: bytes,
  });

  const storageObject = await (prisma as any).storageObject.create({
    data: {
      bucket: uploaded.bucket,
      objectKey: uploaded.objectKey,
      objectType: "EXPORT_ARTIFACT",
      targetType: "ExportJob",
      targetId: job.id,
      readOnly: true,
      expiresAt,
    },
  });

  return (prisma as any).exportJob.update({
    where: { id: job.id },
    data: {
      status: "Succeeded",
      finishedAt: new Date(),
      expiresAt,
      filename: artifact.filename,
      contentType: artifact.contentType,
      rowCount: artifact.count,
      storageObjectId: storageObject.id,
      lastError: null,
    },
  });
}

export async function processQueuedExportJob(jobId?: string) {
  const job = await claimExportJob(jobId);
  if (!job) return null;

  try {
    const filters = parseFilters(job.filtersJson);
    const artifact = await buildExport(job.kind as ExportKind, { id: job.userId, role: job.role, unitId: job.unitId }, filters);
    const updated = await attachArtifactMetadata(job, artifact);
    await auditLog({
      userId: updated.userId,
      role: updated.role,
      action: "EXPORT_JOB_COMPLETED",
      entityType: "ExportJob",
      entityId: updated.id,
      newValue: {
        kind: updated.kind,
        filename: updated.filename,
        rowCount: updated.rowCount,
        expiresAt: updated.expiresAt,
      },
    });
    return updated;
  } catch (error) {
    await markJobFailed(job, error);
    throw error;
  }
}

export async function listUserExportJobs(input: {
  user: ExportUser;
  kind?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(20, Math.max(1, input.pageSize ?? 10));
  const where = {
    userId: input.user.id,
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.status ? { status: input.status } : {}),
  };
  const [rows, total] = await prisma.$transaction([
    (prisma as any).exportJob.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    (prisma as any).exportJob.count({ where }),
  ]);
  return {
    data: rows.map(serializeExportJob),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNextPage: page * pageSize < total,
      nextCursor: null,
    },
  };
}

export function serializeExportJob(job: any) {
  const status = resolveExportJobStatus(job);
  return {
    id: job.id,
    kind: job.kind,
    role: job.role,
    scope: job.scope,
    reason: job.reason,
    status,
    attemptCount: job.attemptCount,
    requestedAt: job.requestedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    expiresAt: job.expiresAt,
    filename: job.filename,
    contentType: job.contentType,
    rowCount: job.rowCount,
    lastError: job.lastError,
    canRetry: status === "Failed" || status === "Expired",
    canDownload: status === "Succeeded" && !!job.storageObjectId,
  };
}

export async function retryExportJob(input: { request: Request; user: ExportUser; jobId: string }) {
  const job = await (prisma as any).exportJob.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error("NOT_FOUND");
  if (job.userId !== input.user.id) throw new Error("FORBIDDEN");
  const status = resolveExportJobStatus(job);
  if (!["Failed", "Expired"].includes(status)) throw new Error("EXPORT_JOB_RETRY_NOT_ALLOWED");

  if (job.storageObjectId) {
    const storageObject = await (prisma as any).storageObject.findUnique({ where: { id: job.storageObjectId } });
    if (storageObject && !storageObject.deletedAt) {
      try {
        await deletePrivateObject({ bucket: storageObject.bucket, objectKey: storageObject.objectKey });
      } catch {
        // Best-effort cleanup before requeue.
      }
      await (prisma as any).storageObject.update({
        where: { id: storageObject.id },
        data: { deletedAt: new Date() },
      });
    }
  }

  const updated = await (prisma as any).exportJob.update({
    where: { id: job.id },
    data: {
      status: "Queued",
      startedAt: null,
      finishedAt: null,
      expiresAt: nowPlusHours(artifactTtlHours()),
      filename: null,
      contentType: null,
      rowCount: null,
      storageObjectId: null,
      lastError: null,
    },
  });
  await auditLog({
    userId: input.user.id,
    role: input.user.role,
    action: "EXPORT_JOB_REQUEUED",
    entityType: "ExportJob",
    entityId: updated.id,
    newValue: { kind: updated.kind, previousStatus: status },
  });
  void queueExportJobProcessing({ requestUrl: input.request.url, jobId: updated.id });
  return serializeExportJob(updated);
}

export async function issueExportArtifactDownload(input: { user: ExportUser; jobId: string }) {
  const job = await (prisma as any).exportJob.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error("NOT_FOUND");
  if (job.userId !== input.user.id) throw new Error("FORBIDDEN");
  if (job.role !== input.user.role) throw new Error("FORBIDDEN");
  if (resolveExportJobStatus(job) !== "Succeeded" || !job.storageObjectId) throw new Error("EXPORT_JOB_NOT_DOWNLOADABLE");

  const storageObject = await (prisma as any).storageObject.findUnique({ where: { id: job.storageObjectId } });
  if (!storageObject || storageObject.deletedAt) throw new Error("EXPORT_JOB_NOT_DOWNLOADABLE");
  if (storageObject.targetType !== "ExportJob" || storageObject.targetId !== job.id) throw new Error("FORBIDDEN");
  if (storageObject.expiresAt && new Date(storageObject.expiresAt).getTime() < Date.now()) {
    await (prisma as any).exportJob.update({
      where: { id: job.id },
      data: { status: "Expired" },
    });
    throw new Error("EXPORT_JOB_NOT_DOWNLOADABLE");
  }

  const url = await createPrivateSignedDownloadUrl({
    bucket: storageObject.bucket,
    objectKey: storageObject.objectKey,
    expiresInSeconds: exportTtlSeconds(),
  });

  await auditLog({
    userId: input.user.id,
    role: input.user.role,
    action: "EXPORT_ARTIFACT_URL_ISSUED",
    entityType: "ExportJob",
    entityId: job.id,
    newValue: { kind: job.kind, expiresInSeconds: exportTtlSeconds() },
  });
  return { url };
}

export async function cleanupExpiredGeneratedFiles() {
  const now = new Date();
  const expired = await (prisma as any).storageObject.findMany({
    where: {
      deletedAt: null,
      expiresAt: { lt: now },
      objectType: { in: [...generatedObjectTypes] },
    },
    take: 200,
  });

  let deleted = 0;
  for (const item of expired) {
    await deletePrivateObject({ bucket: item.bucket, objectKey: item.objectKey }).catch(() => undefined);
    await (prisma as any).storageObject.update({
      where: { id: item.id },
      data: { deletedAt: now },
    });
    if (item.targetType === "ExportJob" && item.targetId) {
      await (prisma as any).exportJob.updateMany({
        where: { id: item.targetId, storageObjectId: item.id },
        data: { status: "Expired" },
      });
    }
    if (item.targetType === "MonthlyReport" && item.targetId) {
      await prisma.monthlyReport.updateMany({
        where: { id: item.targetId },
        data: { fileUrl: null },
      });
    }
    deleted += 1;
  }
  return { deleted, checkedAt: now.toISOString() };
}

export async function authorizeWorkerRequest(request: Request) {
  return request.headers.get("authorization") === `Bearer ${workerSecret()}`;
}
