import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAutomationJob } from "@/lib/automation-jobs";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";

const jobs = ["overdue-action-check", "due-soon-notification", "status-sync", "notification-cleanup", "retention-cleanup"] as const;

export async function GET(request: Request) {
  try {
    await requireUser(["RMTeam", "Admin"]);
    const url = new URL(request.url);
    const { page, pageSize, skip, take } = getPagingParams(url);
    const [runs, total] = await prisma.$transaction([
      (prisma as any).automationRun.findMany({ orderBy: { startedAt: "desc" }, skip, take }),
      (prisma as any).automationRun.count(),
    ]);
    return Response.json({ jobs, runs, meta: buildPageMeta(page, pageSize, total) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const body = await request.json().catch(() => ({}));
    if (!jobs.includes(body.jobName)) return Response.json({ error: "INVALID_JOB" }, { status: 400 });
    const run = await runAutomationJob(body.jobName, user);
    return Response.json(run);
  } catch (error) {
    return apiError(error);
  }
}
