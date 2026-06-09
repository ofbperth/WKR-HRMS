import { beforeEach, describe, expect, it, vi } from "vitest";

const runScheduledEmailSummaryJob = vi.fn();

vi.mock("@/lib/services/scheduled-email-summary", () => ({
  runScheduledEmailSummaryJob,
}));

describe("cron email summary route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("rejects unauthorized requests", async () => {
    const route = await import("@/app/api/cron/email-summary/route");
    const response = await route.GET(new Request("https://example.com/api/cron/email-summary"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
  });

  it("passes dryRun=true through to the job for GET", async () => {
    runScheduledEmailSummaryJob.mockResolvedValue({
      status: "dry-run",
      jobType: "weekly-summary-rca-reminder",
      scheduledFor: "2026-06-09T01:30:00.000Z",
      recipientCount: 2,
      hospitalRecipientCount: 1,
      unitRecipientCount: 1,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 2,
      results: [],
    });
    const route = await import("@/app/api/cron/email-summary/route");
    const request = new Request("https://example.com/api/cron/email-summary?dryRun=true", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await route.GET(request);
    expect(response.status).toBe(200);
    expect(runScheduledEmailSummaryJob).toHaveBeenCalledWith({ dryRun: true });
    await expect(response.json()).resolves.toMatchObject({
      status: "dry-run",
      recipientCount: 2,
      skippedCount: 2,
    });
  });

  it("supports POST and preserves the response contract", async () => {
    runScheduledEmailSummaryJob.mockResolvedValue({
      status: "completed",
      jobType: "weekly-summary-rca-reminder",
      scheduledFor: "2026-06-09T01:30:00.000Z",
      recipientCount: 4,
      hospitalRecipientCount: 3,
      unitRecipientCount: 1,
      sentCount: 3,
      failedCount: 1,
      skippedCount: 0,
      results: [],
    });
    const route = await import("@/app/api/cron/email-summary/route");
    const request = new Request("https://example.com/api/cron/email-summary", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dryRun: false }),
    });
    const response = await route.POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "completed",
      jobType: "weekly-summary-rca-reminder",
      recipientCount: 4,
      sentCount: 3,
      failedCount: 1,
      skippedCount: 0,
    });
  });

  it("does not leak internal error messages", async () => {
    runScheduledEmailSummaryJob.mockRejectedValue(new Error("APP_BASE_URL_MISSING"));
    const route = await import("@/app/api/cron/email-summary/route");
    const request = new Request("https://example.com/api/cron/email-summary", {
      headers: { Authorization: "Bearer test-secret" },
    });
    const response = await route.GET(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "CRON_EMAIL_SUMMARY_FAILED" });
  });
});
