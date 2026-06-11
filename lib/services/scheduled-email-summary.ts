import { Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit";
import { sendHtmlEmail } from "@/lib/email/resend";
import { renderRmSummaryEmail, WEEKLY_SUMMARY_EMAIL_SUBJECT } from "@/lib/email/templates/rm-summary";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey, bangkokScheduledDateTime } from "@/lib/reporting-date";
import { getRcaReminderSummary } from "@/lib/services/rca-reminder";
import { getWeeklyIncidentSummary } from "@/lib/services/rm-summary";

export const WEEKLY_EMAIL_JOB_TYPE = "weekly-summary-rca-reminder";
const DEFAULT_BATCH_SIZE = 10;
const PROCESSING_STATUS = "PROCESSING";
const PROCESSING_STALE_MINUTES = 30;

export type ScheduledRecipientScope = "HOSPITAL" | "UNIT";
export type ScheduledEmailLogStatus = "SENT" | "FAILED" | "SKIPPED";

type ScheduledSummaryRecipient = {
  email: string;
  name: string;
  role: string;
  scope: ScheduledRecipientScope;
  unitId: string | null;
  unitName: string | null;
};

type ScopeSummaryBundle = {
  incidentSummary: Awaited<ReturnType<typeof getWeeklyIncidentSummary>>;
  rcaSummary: Awaited<ReturnType<typeof getRcaReminderSummary>>;
  scopeLabel: string;
};

type ScheduledEmailDependencies = {
  prismaClient?: any;
  now?: Date;
  batchSize?: number;
  sendEmail?: typeof sendHtmlEmail;
  loadScopeSummary?: (recipient: ScheduledSummaryRecipient, now: Date) => Promise<ScopeSummaryBundle>;
  renderEmail?: typeof renderRmSummaryEmail;
  writeAudit?: (input: {
    action: string;
    entityType: string;
    newValue: unknown;
  }) => Promise<unknown>;
};

type DeliveryResult = {
  email: string;
  scope: ScheduledRecipientScope;
  unitId: string | null;
  status: ScheduledEmailLogStatus;
  message: string;
};

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR");
  return message.replaceAll(/\s+/g, " ").slice(0, 300);
}

function isUniqueConstraintError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === "P2002";
  if (!error || typeof error !== "object") return false;
  return (error as { code?: string; name?: string }).code === "P2002"
    && (error as { code?: string; name?: string }).name === "PrismaClientKnownRequestError";
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function staleProcessingCutoff(now: Date) {
  return new Date(now.getTime() - PROCESSING_STALE_MINUTES * 60_000);
}

function getScopeKey(recipient: ScheduledSummaryRecipient) {
  return recipient.scope === "HOSPITAL" ? "HOSPITAL" : `UNIT:${recipient.unitId}`;
}

function getScopeLabel(recipient: ScheduledSummaryRecipient) {
  if (recipient.scope === "HOSPITAL") return "สรุประดับโรงพยาบาล";
  return `สรุปเฉพาะหน่วยงาน ${recipient.unitName ?? "-"}`;
}

function buildIncidentLinkUrl(baseUrl: string, recipient: ScheduledSummaryRecipient, incidentId: string) {
  if (recipient.scope === "UNIT") return `${baseUrl}/unit/incidents/${incidentId}`;
  if (recipient.role === "RMTeam" || recipient.role === "Admin") return `${baseUrl}/rm/incidents/${incidentId}`;
  return `${baseUrl}/dashboard`;
}

function getRoleAwareLinks(baseUrl: string, recipient: ScheduledSummaryRecipient) {
  if (recipient.scope === "UNIT") {
    return {
      dashboardUrl: `${baseUrl}/dashboard`,
      rcaUrl: `${baseUrl}/unit/rca`,
    };
  }
  if (recipient.role === "RMTeam" || recipient.role === "Admin") {
    return {
      dashboardUrl: `${baseUrl}/dashboard`,
      rcaUrl: `${baseUrl}/rm/rca`,
    };
  }
  return {
    dashboardUrl: `${baseUrl}/dashboard`,
    rcaUrl: `${baseUrl}/dashboard`,
  };
}

async function defaultLoadScopeSummary(recipient: ScheduledSummaryRecipient, now: Date) {
  const unitId = recipient.scope === "UNIT" ? recipient.unitId : null;
  const [incidentSummary, rcaSummary] = await Promise.all([
    getWeeklyIncidentSummary({ unitId, now }),
    getRcaReminderSummary({ unitId, now }),
  ]);
  return {
    incidentSummary,
    rcaSummary,
    scopeLabel: getScopeLabel(recipient),
  } satisfies ScopeSummaryBundle;
}

export async function getScheduledSummaryRecipients(prismaClient: any = prisma): Promise<ScheduledSummaryRecipient[]> {
  const users = await prismaClient.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: { in: ["RMTeam", "Executive", "Admin"] } },
        { role: "UnitManager", unitId: { not: null } },
      ],
    },
    select: {
      email: true,
      name: true,
      role: true,
      unitId: true,
      unit: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return users.map((user: { email: string; name: string; role: string; unitId: string | null; unit?: { name: string } | null }) => ({
    email: user.email,
    name: user.name,
    role: user.role,
    scope: user.role === "UnitManager" ? "UNIT" : "HOSPITAL",
    unitId: user.unitId ?? null,
    unitName: user.unit?.name ?? null,
  })) satisfies ScheduledSummaryRecipient[];
}

async function upsertScheduledEmailLog(
  prismaClient: any,
  input: {
    jobType: string;
    scheduledFor: Date;
    recipientEmail: string;
    recipientScope: ScheduledRecipientScope;
    unitId: string | null;
    status: ScheduledEmailLogStatus;
    errorMessage?: string | null;
  },
) {
  return prismaClient.scheduledEmailLog.upsert({
    where: {
      jobType_scheduledFor_recipientEmail: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
      },
    },
    update: {
      recipientScope: input.recipientScope,
      unitId: input.unitId,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
    },
    create: {
      jobType: input.jobType,
      scheduledFor: input.scheduledFor,
      recipientEmail: input.recipientEmail,
      recipientScope: input.recipientScope,
      unitId: input.unitId,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

async function updateScheduledEmailLog(
  prismaClient: any,
  input: {
    jobType: string;
    scheduledFor: Date;
    recipientEmail: string;
    recipientScope: ScheduledRecipientScope;
    unitId: string | null;
    status: string;
    errorMessage?: string | null;
  },
) {
  return prismaClient.scheduledEmailLog.update({
    where: {
      jobType_scheduledFor_recipientEmail: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
      },
    },
    data: {
      recipientScope: input.recipientScope,
      unitId: input.unitId,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

async function reserveScheduledEmailLog(
  prismaClient: any,
  input: {
    jobType: string;
    scheduledFor: Date;
    recipientEmail: string;
    recipientScope: ScheduledRecipientScope;
    unitId: string | null;
    now: Date;
  },
): Promise<{ reserved: true } | { reserved: false; message: string }> {
  try {
    await prismaClient.scheduledEmailLog.create({
      data: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
        recipientScope: input.recipientScope,
        unitId: input.unitId,
        status: PROCESSING_STATUS,
        errorMessage: null,
      },
    });
    return { reserved: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const existing = await prismaClient.scheduledEmailLog.findUnique({
    where: {
      jobType_scheduledFor_recipientEmail: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
      },
    },
  });

  if (!existing) {
    throw new Error("SCHEDULED_EMAIL_RESERVATION_STATE_MISSING");
  }
  if (existing.status === "SENT") {
    return { reserved: false, message: "Already sent for this schedule" };
  }
  if (existing.status === PROCESSING_STATUS) {
    const released = await prismaClient.scheduledEmailLog.updateMany({
      where: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
        status: PROCESSING_STATUS,
        updatedAt: { lt: staleProcessingCutoff(input.now) },
      },
      data: {
        status: "FAILED",
        errorMessage: "STALE_PROCESSING_RECLAIMED",
      },
    });
    if (released.count === 0) {
      return { reserved: false, message: "Another delivery is already in progress" };
    }
  }
  if (existing.status === "FAILED" || existing.status === PROCESSING_STATUS) {
    const claimed = await prismaClient.scheduledEmailLog.updateMany({
      where: {
        jobType: input.jobType,
        scheduledFor: input.scheduledFor,
        recipientEmail: input.recipientEmail,
        status: "FAILED",
      },
      data: {
        recipientScope: input.recipientScope,
        unitId: input.unitId,
        status: PROCESSING_STATUS,
        errorMessage: null,
      },
    });
    if (claimed.count === 1) return { reserved: true };
  }

  return { reserved: false, message: "Recipient already reserved for this schedule" };
}

async function processRecipientSend(
  recipient: ScheduledSummaryRecipient,
  deps: Required<Pick<ScheduledEmailDependencies, "sendEmail" | "loadScopeSummary" | "renderEmail">> & { prismaClient: any; now: Date; dryRun: boolean; scheduledFor: Date; scopeCache: Map<string, Promise<ScopeSummaryBundle>> },
) {
  const scopeKey = getScopeKey(recipient);
  const summaryPromise = deps.scopeCache.get(scopeKey) ?? deps.loadScopeSummary(recipient, deps.now);
  deps.scopeCache.set(scopeKey, summaryPromise);
  const summary = await summaryPromise;

  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("APP_BASE_URL_MISSING");
  const links = getRoleAwareLinks(appBaseUrl, recipient);
  const rendered = deps.renderEmail({
    recipientName: recipient.name,
    scopeLabel: summary.scopeLabel,
    generatedAtLabel: formatDateTime(deps.now),
    windowLabel: summary.incidentSummary.windowLabel,
    incidentMetrics: [
      { label: "New incidents (7 days)", value: summary.incidentSummary.newIncidents },
      { label: "High severity", value: summary.incidentSummary.highSeverityIncidents },
      { label: "Sentinel / critical", value: summary.incidentSummary.sentinelIncidents },
    ],
    topRiskGroups: summary.incidentSummary.topRiskGroups,
    rcaMetrics: [
      { label: "RCA pending", value: summary.rcaSummary.pending },
      { label: "Due within 7 days", value: summary.rcaSummary.dueWithin7Days },
      { label: "Due within 3 days", value: summary.rcaSummary.dueWithin3Days },
      { label: "Due within 1 day", value: summary.rcaSummary.dueWithin1Day },
      { label: "Overdue", value: summary.rcaSummary.overdue },
    ],
    actionItems: summary.rcaSummary.actionItems.map((item) => ({
      incidentNo: item.incidentNo,
      unit: item.unit,
      severity: item.severity,
      rcaStatus: item.rcaStatus,
      dueText: item.dueText,
      linkUrl: buildIncidentLinkUrl(appBaseUrl, recipient, item.incidentId),
    })),
    dashboardUrl: links.dashboardUrl,
    rcaUrl: links.rcaUrl,
  });

  if (deps.dryRun) {
    return {
      email: recipient.email,
      scope: recipient.scope,
      unitId: recipient.unitId,
      status: "SKIPPED",
      message: "Dry run preview generated",
    } satisfies DeliveryResult;
  }

  const reservation = await reserveScheduledEmailLog(deps.prismaClient, {
    jobType: WEEKLY_EMAIL_JOB_TYPE,
    scheduledFor: deps.scheduledFor,
    recipientEmail: recipient.email,
    recipientScope: recipient.scope,
    unitId: recipient.unitId,
    now: deps.now,
  });
  if (!reservation.reserved) {
    return {
      email: recipient.email,
      scope: recipient.scope,
      unitId: recipient.unitId,
      status: "SKIPPED",
      message: reservation.message,
    } satisfies DeliveryResult;
  }

  try {
    await deps.sendEmail({
      to: recipient.email,
      subject: WEEKLY_SUMMARY_EMAIL_SUBJECT,
      html: rendered.html,
      text: rendered.text,
    });
    await updateScheduledEmailLog(deps.prismaClient, {
      jobType: WEEKLY_EMAIL_JOB_TYPE,
      scheduledFor: deps.scheduledFor,
      recipientEmail: recipient.email,
      recipientScope: recipient.scope,
      unitId: recipient.unitId,
      status: "SENT",
      errorMessage: null,
    });
    return {
      email: recipient.email,
      scope: recipient.scope,
      unitId: recipient.unitId,
      status: "SENT",
      message: "Email sent",
    } satisfies DeliveryResult;
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    await updateScheduledEmailLog(deps.prismaClient, {
      jobType: WEEKLY_EMAIL_JOB_TYPE,
      scheduledFor: deps.scheduledFor,
      recipientEmail: recipient.email,
      recipientScope: recipient.scope,
      unitId: recipient.unitId,
      status: "FAILED",
      errorMessage: message,
    });
    return {
      email: recipient.email,
      scope: recipient.scope,
      unitId: recipient.unitId,
      status: "FAILED",
      message,
    } satisfies DeliveryResult;
  }
}

async function defaultWriteAudit(input: { action: string; entityType: string; newValue: unknown }) {
  return auditLog(input);
}

export async function runScheduledEmailSummaryJob(
  input?: ScheduledEmailDependencies & {
    dryRun?: boolean;
  },
) {
  const prismaClient = input?.prismaClient ?? prisma;
  const now = input?.now ?? new Date();
  const scheduledFor = bangkokScheduledDateTime(bangkokDateKey(now), 8, 30);
  if (!scheduledFor) throw new Error("INVALID_SCHEDULED_FOR");

  const recipients: ScheduledSummaryRecipient[] = await getScheduledSummaryRecipients(prismaClient);
  const batchSize = input?.batchSize ?? DEFAULT_BATCH_SIZE;
  const scopeCache = new Map<string, Promise<ScopeSummaryBundle>>();
  const sendEmailImpl = input?.sendEmail ?? sendHtmlEmail;
  const loadScopeSummary = input?.loadScopeSummary ?? defaultLoadScopeSummary;
  const renderEmail = input?.renderEmail ?? renderRmSummaryEmail;
  const writeAudit = input?.writeAudit ?? defaultWriteAudit;

  const results: DeliveryResult[] = [];
  for (const batch of chunk(recipients, batchSize)) {
    const batchResults = await Promise.all(
      batch.map((recipient) =>
        processRecipientSend(recipient, {
          prismaClient,
          now,
          dryRun: input?.dryRun === true,
          scheduledFor,
          scopeCache,
          sendEmail: sendEmailImpl,
          loadScopeSummary,
          renderEmail,
        }),
      ),
    );
    results.push(...batchResults);
  }

  const sentCount = results.filter((item) => item.status === "SENT").length;
  const failedCount = results.filter((item) => item.status === "FAILED").length;
  const skippedCount = results.filter((item) => item.status === "SKIPPED").length;
  const hospitalRecipientCount = recipients.filter((item: ScheduledSummaryRecipient) => item.scope === "HOSPITAL").length;
  const unitRecipientCount = recipients.filter((item: ScheduledSummaryRecipient) => item.scope === "UNIT").length;

  await writeAudit({
    action: input?.dryRun ? "CRON_EMAIL_SUMMARY_DRY_RUN" : "CRON_EMAIL_SUMMARY_RUN",
    entityType: "ScheduledEmailLog",
    newValue: {
      scheduledFor: scheduledFor.toISOString(),
      recipientCount: recipients.length,
      hospitalRecipientCount,
      unitRecipientCount,
      sentCount,
      failedCount,
      skippedCount,
    },
  });

  return {
    status: input?.dryRun ? "dry-run" : "completed",
    jobType: WEEKLY_EMAIL_JOB_TYPE,
    scheduledFor: scheduledFor.toISOString(),
    recipientCount: recipients.length,
    hospitalRecipientCount,
    unitRecipientCount,
    sentCount,
    failedCount,
    skippedCount,
    results,
  };
}
