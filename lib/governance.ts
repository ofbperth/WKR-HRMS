import "server-only";
import { prisma } from "@/lib/prisma";

const dayMs = 1000 * 60 * 60 * 24;

function daysAgo(days: number) {
  return new Date(Date.now() - dayMs * days);
}

function parseResultJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function fallback<T>(promise: Promise<T>, value: T) {
  return promise.catch(() => value);
}

export async function getStorageConsistencyReport() {
  const [storageObjects, attachments, monthlyReports] = await Promise.all([
    fallback((prisma as any).storageObject.findMany({ where: { deletedAt: null }, take: 1000 }), []),
    fallback(prisma.attachment.findMany({ take: 1000 }), []),
    fallback(prisma.monthlyReport.findMany({ where: { fileUrl: { not: null } }, take: 1000 }), []),
  ]);

  const objectKeys = new Set(storageObjects.map((item: any) => item.objectKey));
  const referenced = [
    ...attachments.map((item) => ({ source: "Attachment", id: item.id, key: item.fileUrl })),
    ...monthlyReports.map((item) => ({ source: "MonthlyReport", id: item.id, key: item.fileUrl ?? "" })),
  ].filter((item) => item.key);
  const referencedKeys = new Set(referenced.map((item) => item.key));

  const orphanFiles = storageObjects
    .filter((item: any) => item.targetType && item.targetId && !referencedKeys.has(item.objectKey))
    .map((item: any) => ({ id: item.id, objectKey: item.objectKey, objectType: item.objectType }));
  const missingStorageObjects = referenced
    .filter((item) => !objectKeys.has(item.key))
    .map((item) => ({ source: item.source, id: item.id, objectKey: item.key }));
  const invalidSignedUrlCandidates = storageObjects
    .filter((item: any) => item.objectKey.startsWith("http://") || item.objectKey.startsWith("https://"))
    .map((item: any) => ({ id: item.id, objectKey: item.objectKey }));

  return {
    checkedAt: new Date().toISOString(),
    totals: {
      storageObjects: storageObjects.length,
      referencedFiles: referenced.length,
      orphanFiles: orphanFiles.length,
      missingStorageObjects: missingStorageObjects.length,
      invalidSignedUrlCandidates: invalidSignedUrlCandidates.length,
    },
    orphanFiles,
    missingStorageObjects,
    invalidSignedUrlCandidates,
  };
}

export async function getGovernanceDashboardData() {
  const now = new Date();
  const [
    storageByTier,
    storageByType,
    activeStorageObjects,
    retentionQueue,
    protectedIncidents,
    cleanupRuns,
    failedCleanup,
    cacheByType,
    expiredCache,
    auditSummary,
    archivedIncidents,
    failedRestoreAttempts,
    failedExportAttempts,
    consistency,
  ] = await Promise.all([
    (prisma as any).storageObject.groupBy({ by: ["storageTier"], where: { deletedAt: null }, _count: true }).catch(() => []),
    (prisma as any).storageObject.groupBy({ by: ["objectType"], where: { deletedAt: null }, _count: true }).catch(() => []),
    (prisma as any).storageObject.count({ where: { deletedAt: null } }).catch(() => 0),
    fallback(prisma.incident.count({ where: { OR: [{ retentionReviewRequired: true } as any, { lifecycleStatus: "ARCHIVED" } as any, { lifecycleStatus: "SOFT_DELETED" } as any] } as any }), 0),
    fallback(prisma.incident.findMany({
      where: {
        OR: [
          { isSentinel: true },
          { legalHold: true } as any,
          { underInvestigation: true } as any,
          { retentionReviewRequired: true } as any,
          { status: { in: ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"] } },
        ],
      } as any,
      select: { id: true, incidentNo: true, status: true, severity: true, isSentinel: true, occurredAt: true, incidentUnit: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }), []),
    (prisma as any).retentionRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }).catch(() => []),
    (prisma as any).retentionRun.findMany({ where: { status: { in: ["Failed", "Stopped"] } }, orderBy: { startedAt: "desc" }, take: 10 }).catch(() => []),
    (prisma as any).cacheEntry.groupBy({ by: ["cacheType"], _count: true }).catch(() => []),
    (prisma as any).cacheEntry.count({ where: { expiresAt: { lt: now } } }).catch(() => 0),
    prisma.auditLog.groupBy({ by: ["action"], where: { createdAt: { gte: daysAgo(7) } }, _count: true, orderBy: { _count: { action: "desc" } }, take: 12 }).catch(() => []),
    fallback(prisma.incident.count({ where: { lifecycleStatus: "ARCHIVED" } as any }), 0),
    prisma.auditLog.count({ where: { action: { contains: "RESTORE" }, createdAt: { gte: daysAgo(30) }, newValue: { contains: "FAILED" } } }).catch(() => 0),
    prisma.auditLog.count({ where: { action: { in: ["EXPORT_SIGNED_URL_DENIED", "EXPORT_SIGNED_URL_INVALID"] }, createdAt: { gte: daysAgo(30) } } }).catch(() => 0),
    getStorageConsistencyReport(),
  ]);

  const lastRun = cleanupRuns[0];
  const lastResult = parseResultJson(lastRun?.resultJson);
  const cleanupDurationMs = lastRun?.finishedAt && lastRun?.startedAt
    ? new Date(lastRun.finishedAt).getTime() - new Date(lastRun.startedAt).getTime()
    : null;

  return {
    storageOverview: {
      activeStorageObjects,
      storageByTier,
      storageByType,
      consistency: consistency.totals,
    },
    retentionQueue,
    protectedIncidents,
    cleanupMonitoring: {
      lastRun,
      cleanupDurationMs,
      lastResult,
      recentRuns: cleanupRuns,
    },
    failedCleanup,
    cacheMonitoring: {
      cacheByType,
      expiredCache,
    },
    auditSummary,
    archiveMonitoring: {
      archivedIncidents,
      failedRestoreAttempts,
      failedExportAttempts,
    },
    consistency,
  };
}
