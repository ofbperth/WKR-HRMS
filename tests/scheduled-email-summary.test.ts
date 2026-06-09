import { describe, expect, it, vi } from "vitest";
import { runScheduledEmailSummaryJob } from "@/lib/services/scheduled-email-summary";

describe("scheduled email summary job", () => {
  it("resolves recipients by role and skips already-sent recipients", async () => {
    const logState = new Map<string, { status: string }>([["rm@hospital.local", { status: "SENT" }]]);
    const created: Array<{ email: string; status: string }> = [];
    const updated: Array<{ email: string; status: string }> = [];
    const sentEmails: string[] = [];

    const prismaClient = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          { email: "rm@hospital.local", name: "RM", role: "RMTeam", unitId: null, unit: null },
          { email: "exec@hospital.local", name: "Exec", role: "Executive", unitId: null, unit: null },
          { email: "admin@hospital.local", name: "Admin", role: "Admin", unitId: null, unit: null },
          { email: "unit@hospital.local", name: "Unit", role: "UnitManager", unitId: "unit-1", unit: { name: "Ward A" } },
        ]),
      },
      scheduledEmailLog: {
        create: vi.fn().mockImplementation(({ data }: any) => {
          if (logState.has(data.recipientEmail)) {
            const error = new Error("Unique constraint failed");
            (error as any).code = "P2002";
            error.name = "PrismaClientKnownRequestError";
            throw error;
          }
          logState.set(data.recipientEmail, { status: data.status });
          created.push({ email: data.recipientEmail, status: data.status });
          return Promise.resolve({});
        }),
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const email = where.jobType_scheduledFor_recipientEmail.recipientEmail;
          return Promise.resolve(logState.get(email) ?? null);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const email = where.jobType_scheduledFor_recipientEmail.recipientEmail;
          logState.set(email, { status: data.status });
          updated.push({ email, status: data.status });
          return Promise.resolve({});
        }),
        updateMany: vi.fn().mockImplementation(({ where, data }: any) => {
          const current = logState.get(where.recipientEmail);
          if (!current || current.status !== where.status) return Promise.resolve({ count: 0 });
          logState.set(where.recipientEmail, { status: data.status });
          updated.push({ email: where.recipientEmail, status: data.status });
          return Promise.resolve({ count: 1 });
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const result = await runScheduledEmailSummaryJob({
      prismaClient,
      now: new Date("2026-06-09T01:30:00.000Z"),
      sendEmail: vi.fn().mockImplementation(async ({ to }: { to: string }) => {
        sentEmails.push(to);
        return { id: `email-${to}` };
      }),
      writeAudit: vi.fn().mockResolvedValue({}),
      loadScopeSummary: vi.fn().mockImplementation(async (recipient) => ({
        scopeLabel: recipient.scope === "UNIT" ? "สรุปเฉพาะหน่วยงาน Ward A" : "สรุประดับโรงพยาบาล",
        incidentSummary: {
          windowStart: new Date("2026-06-02T01:30:00.000Z"),
          windowEnd: new Date("2026-06-09T01:30:00.000Z"),
          windowLabel: "02/06/2026 - 09/06/2026",
          newIncidents: 5,
          highSeverityIncidents: 2,
          sentinelIncidents: 1,
          topRiskGroups: [{ label: "Medication", value: 2 }],
        },
        rcaSummary: {
          pending: 2,
          dueWithin7Days: 2,
          dueWithin3Days: 1,
          dueWithin1Day: 1,
          overdue: 0,
          actionItems: [],
        },
      })),
    });

    expect(result.recipientCount).toBe(4);
    expect(result.hospitalRecipientCount).toBe(3);
    expect(result.unitRecipientCount).toBe(1);
    expect(result.sentCount).toBe(3);
    expect(result.skippedCount).toBe(1);
    expect(sentEmails).toEqual(["exec@hospital.local", "admin@hospital.local", "unit@hospital.local"]);
    expect(created).toEqual([
      { email: "exec@hospital.local", status: "PROCESSING" },
      { email: "admin@hospital.local", status: "PROCESSING" },
      { email: "unit@hospital.local", status: "PROCESSING" },
    ]);
    expect(updated).toEqual([
      { email: "exec@hospital.local", status: "SENT" },
      { email: "admin@hospital.local", status: "SENT" },
      { email: "unit@hospital.local", status: "SENT" },
    ]);
  });

  it("skips recipients already being processed by another concurrent run", async () => {
    const prismaClient = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          { email: "exec@hospital.local", name: "Exec", role: "Executive", unitId: null, unit: null },
        ]),
      },
      scheduledEmailLog: {
        create: vi.fn().mockImplementation(() => {
          const error = new Error("Unique constraint failed");
          (error as any).code = "P2002";
          error.name = "PrismaClientKnownRequestError";
          throw error;
        }),
        findUnique: vi.fn().mockResolvedValue({ status: "PROCESSING", updatedAt: new Date("2026-06-09T01:25:00.000Z") }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const sendEmail = vi.fn();
    const result = await runScheduledEmailSummaryJob({
      prismaClient,
      now: new Date("2026-06-09T01:30:00.000Z"),
      sendEmail,
      writeAudit: vi.fn().mockResolvedValue({}),
      loadScopeSummary: vi.fn().mockResolvedValue({
        scopeLabel: "สรุประดับโรงพยาบาล",
        incidentSummary: {
          windowStart: new Date("2026-06-02T01:30:00.000Z"),
          windowEnd: new Date("2026-06-09T01:30:00.000Z"),
          windowLabel: "02/06/2026 - 09/06/2026",
          newIncidents: 1,
          highSeverityIncidents: 0,
          sentinelIncidents: 0,
          topRiskGroups: [],
        },
        rcaSummary: {
          pending: 0,
          dueWithin7Days: 0,
          dueWithin3Days: 0,
          dueWithin1Day: 0,
          overdue: 0,
          actionItems: [],
        },
      }),
    });

    expect(result.sentCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reclaims stale processing locks before sending", async () => {
    const logState = new Map<string, { status: string; updatedAt: Date }>([
      ["exec@hospital.local", { status: "PROCESSING", updatedAt: new Date("2026-06-09T00:00:00.000Z") }],
    ]);
    const sendEmail = vi.fn().mockResolvedValue({ id: "email-1" });

    const prismaClient = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          { email: "exec@hospital.local", name: "Exec", role: "Executive", unitId: null, unit: null },
        ]),
      },
      scheduledEmailLog: {
        create: vi.fn().mockImplementation(() => {
          const error = new Error("Unique constraint failed");
          (error as any).code = "P2002";
          error.name = "PrismaClientKnownRequestError";
          throw error;
        }),
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const email = where.jobType_scheduledFor_recipientEmail.recipientEmail;
          return Promise.resolve(logState.get(email) ?? null);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const email = where.jobType_scheduledFor_recipientEmail.recipientEmail;
          logState.set(email, { status: data.status, updatedAt: new Date("2026-06-09T01:30:00.000Z") });
          return Promise.resolve({});
        }),
        updateMany: vi.fn().mockImplementation(({ where, data }: any) => {
          const current = logState.get(where.recipientEmail);
          if (!current || current.status !== where.status) return Promise.resolve({ count: 0 });
          if (where.updatedAt && !(current.updatedAt < where.updatedAt.lt)) return Promise.resolve({ count: 0 });
          logState.set(where.recipientEmail, { status: data.status, updatedAt: new Date("2026-06-09T01:30:00.000Z") });
          return Promise.resolve({ count: 1 });
        }),
      },
    };

    const result = await runScheduledEmailSummaryJob({
      prismaClient,
      now: new Date("2026-06-09T01:30:00.000Z"),
      sendEmail,
      writeAudit: vi.fn().mockResolvedValue({}),
      loadScopeSummary: vi.fn().mockResolvedValue({
        scopeLabel: "สรุประดับโรงพยาบาล",
        incidentSummary: {
          windowStart: new Date("2026-06-02T01:30:00.000Z"),
          windowEnd: new Date("2026-06-09T01:30:00.000Z"),
          windowLabel: "02/06/2026 - 09/06/2026",
          newIncidents: 1,
          highSeverityIncidents: 0,
          sentinelIncidents: 0,
          topRiskGroups: [],
        },
        rcaSummary: {
          pending: 0,
          dueWithin7Days: 0,
          dueWithin3Days: 0,
          dueWithin1Day: 0,
          overdue: 0,
          actionItems: [],
        },
      }),
    });

    expect(result.sentCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
