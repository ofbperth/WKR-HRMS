import "server-only";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

const dayMs = 1000 * 60 * 60 * 24;
const protectedStatuses = new Set(["New", "UnderReview", "RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"]);

export type RetentionMode = "dry-run" | "apply";

type RetentionUser = { id?: string | null; role?: string | null; name?: string | null };

function isDryRun() {
  return process.env.RETENTION_DRY_RUN !== "false";
}

function maxDeletesPerRun() {
  const parsed = Number(process.env.MAX_RETENTION_DELETE_PER_RUN ?? "100");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 100;
}

function yearsAgo(years: number) {
  return new Date(Date.now() - dayMs * 365 * years);
}

function daysAgo(days: number) {
  return new Date(Date.now() - dayMs * days);
}

function isProtectedIncident(incident: any) {
  return Boolean(
    protectedStatuses.has(incident.status) ||
    incident.rca ||
    (incident.actionPlans?.length ?? 0) > 0 ||
    incident.isSentinel ||
    incident.legalHold ||
    incident.underInvestigation,
  );
}

async function createRetentionRun(mode: RetentionMode, user?: RetentionUser) {
  return (prisma as any).retentionRun.create({
    data: {
      mode,
      status: "Running",
      createdById: user?.id ?? null,
    },
  });
}

async function finishRetentionRun(id: string, status: "Success" | "Failed" | "Stopped", result: Record<string, unknown>) {
  return (prisma as any).retentionRun.update({
    where: { id },
    data: {
      status,
      finishedAt: new Date(),
      reviewed: Number(result.reviewed ?? 0),
      archived: Number(result.archived ?? 0),
      softDeleted: Number(result.softDeleted ?? 0),
      filesDeleted: Number(result.filesDeleted ?? 0),
      skippedProtected: Number(result.skippedProtected ?? 0),
      stoppedByFailsafe: Boolean(result.stoppedByFailsafe),
      message: String(result.message ?? ""),
      resultJson: JSON.stringify(result),
    },
  });
}

export async function restoreIncidentLifecycle(incidentId: string, user: { id: string; role: string }) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new Error("NOT_FOUND");
  if (!["ARCHIVED", "SOFT_DELETED"].includes((incident as any).lifecycleStatus ?? "ACTIVE")) {
    throw new Error("RESTORE_NOT_ALLOWED_FOR_STATE");
  }

  const restored = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      lifecycleStatus: "ACTIVE",
      archivedAt: null,
      deletedAt: null,
      retentionReviewRequired: false,
    } as any,
  });
  await auditLog({
    userId: user.id,
    role: user.role,
    action: "RESTORE_INCIDENT",
    entityType: "Incident",
    entityId: incidentId,
    oldValue: { lifecycleStatus: (incident as any).lifecycleStatus, archivedAt: (incident as any).archivedAt, deletedAt: (incident as any).deletedAt },
    newValue: { lifecycleStatus: "ACTIVE" },
  });
  return restored;
}

export async function runRetentionCleanup(user?: RetentionUser) {
  const mode: RetentionMode = isDryRun() ? "dry-run" : "apply";
  const run = await createRetentionRun(mode, user);
  const result = {
    mode,
    reviewed: 0,
    archived: 0,
    softDeleted: 0,
    filesDeleted: 0,
    skippedProtected: 0,
    stoppedByFailsafe: false,
    message: "",
  };

  try {
    const maxDeletes = maxDeletesPerRun();
    const incidentCutoff = yearsAgo(5);
    const archiveCutoff = daysAgo(365);
    const cacheCutoff = new Date();

    const expiredCache = await (prisma as any).cacheEntry.findMany({
      where: { expiresAt: { lt: cacheCutoff } },
      select: { id: true, cacheType: true },
      take: maxDeletes + 1,
    });
    const expiredFiles = await (prisma as any).storageObject.findMany({
      where: {
        expiresAt: { lt: cacheCutoff },
        deletedAt: null,
        objectType: { in: ["TEMP_EXPORT", "DASHBOARD_CACHE", "SEARCH_CACHE", "GENERATED_CHART_CACHE"] },
      },
      select: { id: true, objectKey: true, objectType: true },
      take: maxDeletes + 1,
    });

    const deletionCandidates = expiredCache.length + expiredFiles.length;
    if (deletionCandidates > maxDeletes) {
      result.stoppedByFailsafe = true;
      result.message = `Failsafe stopped retention: ${deletionCandidates} cleanup candidates exceed MAX_RETENTION_DELETE_PER_RUN=${maxDeletes}`;
      await auditLog({ userId: user?.id, role: user?.role, action: "RETENTION_FAILSAFE_STOP", entityType: "RetentionRun", entityId: run.id, newValue: result });
      await finishRetentionRun(run.id, "Stopped", result);
      return result;
    }

    if (!isDryRun()) {
      await (prisma as any).cacheEntry.deleteMany({ where: { id: { in: expiredCache.map((item: any) => item.id) } } });
      await (prisma as any).storageObject.updateMany({
        where: { id: { in: expiredFiles.map((item: any) => item.id) } },
        data: { deletedAt: new Date() },
      });
    }
    result.filesDeleted = expiredFiles.length;

    const incidents = await prisma.incident.findMany({
      where: {
        occurredAt: { lt: incidentCutoff },
        deletedAt: null,
      } as any,
      include: { rca: true, actionPlans: true },
      take: 500,
    });
    result.reviewed = incidents.length;

    for (const incident of incidents as any[]) {
      if (isProtectedIncident(incident)) {
        result.skippedProtected += 1;
        if (!isDryRun() && !incident.retentionReviewRequired) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: { retentionReviewRequired: true } as any,
          });
        }
        continue;
      }

      if ((incident.lifecycleStatus ?? "ACTIVE") === "ACTIVE" && incident.occurredAt < archiveCutoff) {
        result.archived += 1;
        if (!isDryRun()) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: { lifecycleStatus: "ARCHIVED", archivedAt: new Date() } as any,
          });
        }
        continue;
      }

      if (incident.lifecycleStatus === "ARCHIVED") {
        result.softDeleted += 1;
        if (!isDryRun()) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: { lifecycleStatus: "SOFT_DELETED", deletedAt: new Date() } as any,
          });
        }
      }
    }

    const oldAnnualSnapshots = await (prisma as any).storageObject.findMany({
      where: { objectType: "ANNUAL_SNAPSHOT", expiresAt: { lt: cacheCutoff }, deletedAt: null },
      take: maxDeletes + 1,
    });
    if (oldAnnualSnapshots.length > maxDeletes) {
      result.stoppedByFailsafe = true;
      result.message = "Failsafe stopped annual snapshot cleanup";
      await auditLog({ userId: user?.id, role: user?.role, action: "RETENTION_FAILSAFE_STOP", entityType: "RetentionRun", entityId: run.id, newValue: result });
      await finishRetentionRun(run.id, "Stopped", result);
      return result;
    }
    if (!isDryRun()) {
      await (prisma as any).storageObject.updateMany({
        where: { id: { in: oldAnnualSnapshots.map((item: any) => item.id) } },
        data: { deletedAt: new Date() },
      });
    }

    result.message = isDryRun() ? "Retention dry-run completed without deleting data" : "Retention cleanup completed";
    await auditLog({ userId: user?.id, role: user?.role, action: isDryRun() ? "RETENTION_DRY_RUN" : "RETENTION_CLEANUP", entityType: "RetentionRun", entityId: run.id, newValue: result });
    await finishRetentionRun(run.id, "Success", result);
    return result;
  } catch (error) {
    result.message = error instanceof Error ? error.message : "Retention cleanup failed";
    await auditLog({ userId: user?.id, role: user?.role, action: "RETENTION_FAILED", entityType: "RetentionRun", entityId: run.id, newValue: result });
    await finishRetentionRun(run.id, "Failed", result);
    throw error;
  }
}
