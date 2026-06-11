import { isValidCronAuthorizationHeader, readDryRunFlag } from "@/lib/cron-auth";
import { runScheduledEmailSummaryJob } from "@/lib/services/scheduled-email-summary";

async function handleCronRequest(request: Request) {
  if (!isValidCronAuthorizationHeader(request.headers.get("authorization"))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : undefined;
    const dryRun = readDryRunFlag(request, body);
    const result = await runScheduledEmailSummaryJob({ dryRun });
    return Response.json(result);
  } catch (error) {
    console.error("cron email summary failed", error);
    return Response.json({ error: "CRON_EMAIL_SUMMARY_FAILED" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}
