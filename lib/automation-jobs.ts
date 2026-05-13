import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { runRetentionCleanup } from "@/lib/retention";

type AutomationUser = { id: string; role: string; name?: string };

async function createRun(jobName: string, user?: AutomationUser) {
  return (prisma as any).automationRun.create({
    data: {
      jobName,
      status: "Running",
      triggeredBy: user ? `${user.name ?? user.id} (${user.role})` : "system",
    },
  });
}

async function finishRun(id: string, status: "Success" | "Failed", data: { message?: string; result?: unknown; error?: unknown }) {
  return (prisma as any).automationRun.update({
    where: { id },
    data: {
      status,
      finishedAt: new Date(),
      message: data.message ?? null,
      resultJson: data.result === undefined ? null : JSON.stringify(data.result),
      error: data.error instanceof Error ? data.error.message : data.error ? String(data.error) : null,
    },
  });
}

async function createNotificationOnce(input: { userId: string; type: string; title: string; message: string; relatedIncidentId?: string | null }) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      relatedIncidentId: input.relatedIncidentId ?? null,
      isRead: false,
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    },
  });
  if (existing) return false;
  await prisma.notification.create({ data: { ...input, relatedIncidentId: input.relatedIncidentId ?? null } });
  return true;
}

export async function runOverdueActionCheck(user?: AutomationUser) {
  const run = await createRun("overdue-action-check", user);
  try {
    const now = new Date();
    const actions = await prisma.actionPlan.findMany({
      where: { dueDate: { lt: now }, status: { in: ["NotStarted", "Ongoing"] } },
      include: { incident: true, owner: true },
    });
    let delayed = 0;
    let notifications = 0;
    for (const action of actions) {
      await prisma.actionPlan.update({ where: { id: action.id }, data: { status: "Delayed" } });
      delayed += 1;
      if (!action.ownerId) continue;
      const created = await createNotificationOnce({
        userId: action.ownerId,
        type: "action-overdue",
        title: "Action overdue",
        message: `${action.incident.incidentNo}: ${action.title}`,
        relatedIncidentId: action.incidentId,
      });
      if (created) notifications += 1;
    }
    await auditLog({ userId: user?.id, action: "AUTOMATION_OVERDUE_ACTION_CHECK", entityType: "AutomationRun", entityId: run.id, newValue: { delayed, notifications } });
    return finishRun(run.id, "Success", { message: `Updated ${delayed} overdue actions`, result: { delayed, notifications } });
  } catch (error) {
    return finishRun(run.id, "Failed", { message: "Overdue action check failed", error });
  }
}

export async function runDueSoonNotification(user?: AutomationUser) {
  const run = await createRun("due-soon-notification", user);
  try {
    const now = new Date();
    const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    const actions = await prisma.actionPlan.findMany({
      where: { dueDate: { gte: now, lte: soon }, status: { in: ["NotStarted", "Ongoing"] } },
      include: { incident: true },
    });
    let notifications = 0;
    for (const action of actions) {
      if (!action.ownerId) continue;
      const created = await createNotificationOnce({
        userId: action.ownerId,
        type: "action-due-soon",
        title: "Action due soon",
        message: `${action.incident.incidentNo}: ${action.title}`,
        relatedIncidentId: action.incidentId,
      });
      if (created) notifications += 1;
    }
    await auditLog({ userId: user?.id, action: "AUTOMATION_DUE_SOON_NOTIFICATION", entityType: "AutomationRun", entityId: run.id, newValue: { notifications } });
    return finishRun(run.id, "Success", { message: `Created ${notifications} due-soon notifications`, result: { notifications } });
  } catch (error) {
    return finishRun(run.id, "Failed", { message: "Due soon notification failed", error });
  }
}

export async function runStatusSync(user?: AutomationUser) {
  const run = await createRun("status-sync", user);
  try {
    const verifiedActionGroups = await prisma.incident.findMany({
      where: { status: "ActionOngoing", actionPlans: { some: {} } },
      include: { actionPlans: true },
    });
    let waitingVerification = 0;
    for (const incident of verifiedActionGroups) {
      if (incident.actionPlans.length > 0 && incident.actionPlans.every((action) => action.status === "Verified")) {
        await prisma.incident.update({ where: { id: incident.id }, data: { status: "WaitingVerification" } });
        waitingVerification += 1;
      }
    }
    await auditLog({ userId: user?.id, action: "AUTOMATION_STATUS_SYNC", entityType: "AutomationRun", entityId: run.id, newValue: { waitingVerification } });
    return finishRun(run.id, "Success", { message: `Synced ${waitingVerification} incidents`, result: { waitingVerification } });
  } catch (error) {
    return finishRun(run.id, "Failed", { message: "Status sync failed", error });
  }
}

export async function runNotificationCleanup(user?: AutomationUser) {
  const run = await createRun("notification-cleanup", user);
  try {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
    const result = await prisma.notification.deleteMany({ where: { isRead: true, createdAt: { lt: cutoff } } });
    await auditLog({ userId: user?.id, action: "AUTOMATION_NOTIFICATION_CLEANUP", entityType: "AutomationRun", entityId: run.id, newValue: { deleted: result.count } });
    return finishRun(run.id, "Success", { message: `Deleted ${result.count} old read notifications`, result: { deleted: result.count } });
  } catch (error) {
    return finishRun(run.id, "Failed", { message: "Notification cleanup failed", error });
  }
}

export async function runAutomationJob(jobName: string, user?: AutomationUser) {
  if (jobName === "overdue-action-check") return runOverdueActionCheck(user);
  if (jobName === "due-soon-notification") return runDueSoonNotification(user);
  if (jobName === "status-sync") return runStatusSync(user);
  if (jobName === "notification-cleanup") return runNotificationCleanup(user);
  if (jobName === "retention-cleanup") {
    const run = await createRun("retention-cleanup", user);
    try {
      const result = await runRetentionCleanup(user);
      return finishRun(run.id, "Success", { message: "Retention cleanup completed", result });
    } catch (error) {
      return finishRun(run.id, "Failed", { message: "Retention cleanup failed", error });
    }
  }
  throw new Error("UNKNOWN_AUTOMATION_JOB");
}
