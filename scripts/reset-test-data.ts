import { prisma } from "@/lib/prisma";

type ResetMode = "dry-run" | "confirm";

type DbSummary = {
  source: "DIRECT_URL" | "DATABASE_URL";
  protocol: string;
  host: string;
  port: string | null;
  database: string | null;
};

type StorageTarget = {
  id: string;
  bucket: string;
  objectKey: string;
  targetType: string | null;
  targetId: string | null;
  deletedAt: Date | null;
};

type ResetPlan = {
  incidentIds: string[];
  incidentTeamIds: string[];
  rcaIds: string[];
  actionPlanIds: string[];
  commentIds: string[];
  attachmentIds: string[];
  notificationIds: string[];
  monthlyReportIds: string[];
  exportAccessGrantIds: string[];
  exportJobIds: string[];
  storageObjects: StorageTarget[];
  auditLogIds: string[];
  counts: Record<string, number>;
};

type Snapshot = {
  database: DbSummary;
  preserved: Record<string, number>;
  review: Record<string, number>;
  resetPlan: Record<string, number>;
};

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function getMode(): ResetMode {
  const dryRun = hasFlag("--dry-run");
  const confirm = hasFlag("--confirm-reset-test-data");

  if (dryRun && confirm) throw new Error("Choose only one mode: --dry-run or --confirm-reset-test-data");
  if (!dryRun && !confirm) throw new Error("Refusing to run without --dry-run or --confirm-reset-test-data");
  return dryRun ? "dry-run" : "confirm";
}

function getDatabaseSummary(): DbSummary {
  const directUrl = process.env.DIRECT_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const raw = directUrl || databaseUrl;
  if (!raw) throw new Error("DIRECT_URL_OR_DATABASE_URL_REQUIRED");

  try {
    const url = new URL(raw);
    return {
      source: directUrl ? "DIRECT_URL" : "DATABASE_URL",
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\/+/, "") || null,
    };
  } catch {
    throw new Error("DATABASE_URL_INVALID");
  }
}

async function collectPreservedCounts() {
  const [user, unit, team, riskCode, authSettings, userInvite] = await Promise.all([
    prisma.user.count(),
    prisma.unit.count(),
    prisma.team.count(),
    prisma.riskCode.count(),
    prisma.authSettings.count(),
    prisma.userInvite.count(),
  ]);

  return { user, unit, team, riskCode, authSettings, userInvite };
}

async function collectReviewCounts() {
  const [auditLog, automationRun, scheduledEmailLog, retentionRun, storageObject] = await Promise.all([
    prisma.auditLog.count(),
    prisma.automationRun.count(),
    prisma.scheduledEmailLog.count(),
    prisma.retentionRun.count(),
    (prisma as any).storageObject.count(),
  ]);

  return { auditLog, automationRun, scheduledEmailLog, retentionRun, storageObject };
}

async function collectResetPlan(): Promise<ResetPlan> {
  const [
    incidents,
    incidentTeams,
    rcas,
    actionPlans,
    comments,
    attachments,
    notifications,
    monthlyReports,
    exportAccessGrants,
    exportJobs,
    cacheEntryCount,
  ] = await Promise.all([
    prisma.incident.findMany({ select: { id: true } }),
    prisma.incidentTeam.findMany({ select: { id: true } }),
    prisma.rCA.findMany({ select: { id: true } }),
    prisma.actionPlan.findMany({ select: { id: true } }),
    prisma.comment.findMany({ select: { id: true } }),
    prisma.attachment.findMany({ select: { id: true } }),
    prisma.notification.findMany({ select: { id: true, relatedIncidentId: true } }),
    prisma.monthlyReport.findMany({ select: { id: true } }),
    (prisma as any).exportAccessGrant.findMany({ select: { id: true } }),
    (prisma as any).exportJob.findMany({ select: { id: true } }),
    (prisma as any).cacheEntry.count(),
  ]);

  const incidentIds = incidents.map((item) => item.id);
  const incidentTeamIds = incidentTeams.map((item) => item.id);
  const rcaIds = rcas.map((item) => item.id);
  const actionPlanIds = actionPlans.map((item) => item.id);
  const commentIds = comments.map((item) => item.id);
  const attachmentIds = attachments.map((item) => item.id);
  const monthlyReportIds = monthlyReports.map((item) => item.id);
  const exportAccessGrantIds = exportAccessGrants.map((item: { id: string }) => item.id);
  const exportJobIds = exportJobs.map((item: { id: string }) => item.id);
  const notificationIds = notifications.filter((item) => item.relatedIncidentId && incidentIds.includes(item.relatedIncidentId)).map((item) => item.id);

  const storageFilters = [
    exportJobIds.length > 0
      ? { targetType: "ExportJob", targetId: { in: exportJobIds } }
      : null,
    monthlyReportIds.length > 0
      ? { targetType: "MonthlyReport", targetId: { in: monthlyReportIds } }
      : null,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  const storageObjects = storageFilters.length === 0
    ? []
    : await (prisma as any).storageObject.findMany({
        where: { OR: storageFilters },
        select: {
          id: true,
          bucket: true,
          objectKey: true,
          targetType: true,
          targetId: true,
          deletedAt: true,
        },
      });

  const storageObjectIds = storageObjects.map((item: StorageTarget) => item.id);

  const auditFilters: Array<Record<string, unknown>> = [];
  if (incidentIds.length > 0) auditFilters.push({ entityType: "Incident", entityId: { in: incidentIds } });
  if (rcaIds.length > 0) auditFilters.push({ entityType: "RCA", entityId: { in: rcaIds } });
  if (actionPlanIds.length > 0) auditFilters.push({ entityType: "ActionPlan", entityId: { in: actionPlanIds } });
  if (commentIds.length > 0) auditFilters.push({ entityType: "Comment", entityId: { in: commentIds } });
  if (attachmentIds.length > 0) auditFilters.push({ entityType: "Attachment", entityId: { in: attachmentIds } });
  if (monthlyReportIds.length > 0) auditFilters.push({ entityType: "MonthlyReport", entityId: { in: monthlyReportIds } });
  if (exportJobIds.length > 0) auditFilters.push({ entityType: "ExportJob", entityId: { in: exportJobIds } });
  if (exportAccessGrantIds.length > 0) auditFilters.push({ entityType: "Export", entityId: { in: exportAccessGrantIds } });
  if (storageObjectIds.length > 0) auditFilters.push({ entityType: "StorageObject", entityId: { in: storageObjectIds } });

  const auditLogIds = auditFilters.length === 0
    ? []
    : (await prisma.auditLog.findMany({
        where: { OR: auditFilters as any },
        select: { id: true },
      })).map((item) => item.id);

  return {
    incidentIds,
    incidentTeamIds,
    rcaIds,
    actionPlanIds,
    commentIds,
    attachmentIds,
    notificationIds,
    monthlyReportIds,
    exportAccessGrantIds,
    exportJobIds,
    storageObjects,
    auditLogIds,
    counts: {
      incident: incidentIds.length,
      incidentTeam: incidentTeamIds.length,
      rca: rcaIds.length,
      actionPlan: actionPlanIds.length,
      comment: commentIds.length,
      attachment: attachmentIds.length,
      notification: notificationIds.length,
      monthlyReport: monthlyReportIds.length,
      exportAccessGrant: exportAccessGrantIds.length,
      exportJob: exportJobIds.length,
      storageObject: storageObjects.length,
      auditLog: auditLogIds.length,
      cacheEntry: cacheEntryCount,
    },
  };
}

async function buildSnapshot(): Promise<Snapshot> {
  const [database, preserved, review, resetPlan] = await Promise.all([
    Promise.resolve(getDatabaseSummary()),
    collectPreservedCounts(),
    collectReviewCounts(),
    collectResetPlan(),
  ]);

  return {
    database,
    preserved,
    review,
    resetPlan: resetPlan.counts,
  };
}

function printSnapshot(mode: ResetMode, snapshot: Snapshot) {
  console.log(JSON.stringify({
    mode,
    database: snapshot.database,
    preservedCounts: snapshot.preserved,
    reviewCounts: snapshot.review,
    resetPlanCounts: snapshot.resetPlan,
  }, null, 2));
}

function requireStorageConfig() {
  if (!process.env.SUPABASE_URL?.trim()) throw new Error("SUPABASE_URL_REQUIRED_FOR_STORAGE_CLEANUP");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED_FOR_STORAGE_CLEANUP");
}

function getStorageHeaders(contentType?: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED_FOR_STORAGE_CLEANUP");

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  headers.set("apikey", serviceRoleKey);
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

function getStorageBaseUrl() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  if (!supabaseUrl) throw new Error("SUPABASE_URL_REQUIRED_FOR_STORAGE_CLEANUP");
  return supabaseUrl.replace(/\/+$/, "");
}

async function deleteStorageObject(item: Pick<StorageTarget, "bucket" | "objectKey">) {
  const encodedPath = item.objectKey.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${getStorageBaseUrl()}/storage/v1/object/${encodeURIComponent(item.bucket)}/${encodedPath}`, {
    method: "DELETE",
    headers: getStorageHeaders(),
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`EXPORT_STORAGE_DELETE_FAILED:${response.status}`);
}

async function cleanupStorageObjects(storageObjects: StorageTarget[]) {
  const activeObjects = storageObjects.filter((item) => !item.deletedAt);
  if (activeObjects.length === 0) return { attempted: 0, deleted: 0 };

  requireStorageConfig();
  let deleted = 0;
  for (const item of activeObjects) {
    await deleteStorageObject({ bucket: item.bucket, objectKey: item.objectKey });
    deleted += 1;
  }
  return { attempted: activeObjects.length, deleted };
}

async function runDeleteTransaction(plan: ResetPlan) {
  await prisma.$transaction(async (tx) => {
    if (plan.incidentTeamIds.length > 0) {
      await tx.incidentTeam.deleteMany({ where: { id: { in: plan.incidentTeamIds } } });
    }
    if (plan.commentIds.length > 0) {
      await tx.comment.deleteMany({ where: { id: { in: plan.commentIds } } });
    }
    if (plan.attachmentIds.length > 0) {
      await tx.attachment.deleteMany({ where: { id: { in: plan.attachmentIds } } });
    }
    if (plan.actionPlanIds.length > 0) {
      await tx.actionPlan.deleteMany({ where: { id: { in: plan.actionPlanIds } } });
    }
    if (plan.notificationIds.length > 0) {
      await tx.notification.deleteMany({ where: { id: { in: plan.notificationIds } } });
    }
    if (plan.auditLogIds.length > 0) {
      await tx.auditLog.deleteMany({ where: { id: { in: plan.auditLogIds } } });
    }
    if (plan.rcaIds.length > 0) {
      await tx.rCA.deleteMany({ where: { id: { in: plan.rcaIds } } });
    }
    if (plan.incidentIds.length > 0) {
      await tx.incident.deleteMany({ where: { id: { in: plan.incidentIds } } });
    }
    if (plan.exportAccessGrantIds.length > 0) {
      await (tx as any).exportAccessGrant.deleteMany({ where: { id: { in: plan.exportAccessGrantIds } } });
    }
    if (plan.exportJobIds.length > 0) {
      await (tx as any).exportJob.deleteMany({ where: { id: { in: plan.exportJobIds } } });
    }
    if (plan.monthlyReportIds.length > 0) {
      await tx.monthlyReport.deleteMany({ where: { id: { in: plan.monthlyReportIds } } });
    }
    if (plan.storageObjects.length > 0) {
      await (tx as any).storageObject.deleteMany({ where: { id: { in: plan.storageObjects.map((item) => item.id) } } });
    }
    if (plan.counts.cacheEntry > 0) {
      await (tx as any).cacheEntry.deleteMany({});
    }
  });
}

async function main() {
  const mode = getMode();
  const snapshot = await buildSnapshot();
  printSnapshot(mode, snapshot);

  const plan = await collectResetPlan();
  const totalTargets = Object.values(plan.counts).reduce((sum, count) => sum + count, 0);

  if (mode === "dry-run") {
    console.log(JSON.stringify({
      status: "dry-run-complete",
      totalTargets,
      storageDeleteRequired: plan.storageObjects.some((item) => !item.deletedAt),
    }, null, 2));
    return;
  }

  if (totalTargets === 0) {
    const after = await buildSnapshot();
    console.log(JSON.stringify({ status: "no-op", message: "No incident workflow reset targets found." }, null, 2));
    console.log(JSON.stringify({ after }, null, 2));
    return;
  }

  const storageCleanup = await cleanupStorageObjects(plan.storageObjects);
  await runDeleteTransaction(plan);

  const after = await buildSnapshot();
  console.log(JSON.stringify({
    status: "reset-complete",
    storageCleanup,
    after,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
