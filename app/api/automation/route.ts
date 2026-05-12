import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAutomationJob } from "@/lib/automation-jobs";

const jobs = ["overdue-action-check", "due-soon-notification", "status-sync", "notification-cleanup", "retention-cleanup"] as const;

export async function GET() {
  try {
    await requireUser(["RMTeam", "Admin"]);
    const runs = await (prisma as any).automationRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
    return Response.json({ jobs, runs });
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
