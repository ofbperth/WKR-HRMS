import { describe, expect, it } from "vitest";
import { renderRmSummaryEmail } from "@/lib/email/templates/rm-summary";
import { classifyRcaReminderBucket, formatRcaDueText, formatRcaReminderStatus, selectActionRequiredItems } from "@/lib/services/rca-reminder";

describe("rca reminder helpers", () => {
  it("classifies RCA due buckets using Bangkok day windows", () => {
    expect(classifyRcaReminderBucket(-2)).toBe("OVERDUE");
    expect(classifyRcaReminderBucket(0)).toBe("DUE_1");
    expect(classifyRcaReminderBucket(2)).toBe("DUE_3");
    expect(classifyRcaReminderBucket(5)).toBe("DUE_7");
    expect(classifyRcaReminderBucket(10)).toBe("LATER");
  });

  it("prioritizes overdue and near-due items before later items", () => {
    const items = selectActionRequiredItems([
      {
        incidentId: "later",
        incidentNo: "INC-003",
        unit: "Ward C",
        severity: "I",
        rcaStatus: "Draft",
        dueText: formatRcaDueText(9),
        dueBucket: "LATER",
        dueDays: 9,
        dueAt: new Date("2026-06-18T00:00:00.000Z"),
      },
      {
        incidentId: "overdue",
        incidentNo: "INC-001",
        unit: "Ward A",
        severity: "E",
        rcaStatus: "Draft",
        dueText: formatRcaDueText(-1),
        dueBucket: "OVERDUE",
        dueDays: -1,
        dueAt: new Date("2026-06-08T00:00:00.000Z"),
      },
      {
        incidentId: "soon",
        incidentNo: "INC-002",
        unit: "Ward B",
        severity: "H",
        rcaStatus: "RevisionRequired",
        dueText: formatRcaDueText(1),
        dueBucket: "DUE_1",
        dueDays: 1,
        dueAt: new Date("2026-06-10T00:00:00.000Z"),
      },
    ]);

    expect(items.map((item) => item.incidentId)).toEqual(["overdue", "soon"]);
  });

  it("distinguishes missing RCA from draft RCA", () => {
    expect(formatRcaReminderStatus(undefined)).toBe("ยังไม่เริ่ม RCA");
    expect(formatRcaReminderStatus("Draft")).toBe("ร่าง");
  });

  it("renders only the allowed action-required fields into the email output", () => {
    const rendered = renderRmSummaryEmail({
      recipientName: "RM Team",
      scopeLabel: "สรุประดับโรงพยาบาล",
      generatedAtLabel: "09/06/2026 08:30",
      windowLabel: "02/06/2026 - 09/06/2026",
      incidentMetrics: [
        { label: "New incidents (7 days)", value: 10 },
        { label: "High severity", value: 3 },
        { label: "Sentinel / critical", value: 1 },
      ],
      topRiskGroups: [{ label: "Medication", value: 4 }],
      rcaMetrics: [
        { label: "RCA pending", value: 5 },
        { label: "Due within 7 days", value: 4 },
        { label: "Due within 3 days", value: 2 },
        { label: "Due within 1 day", value: 1 },
        { label: "Overdue", value: 1 },
      ],
      actionItems: [
        {
          incidentNo: "INC-0001",
          unit: "Ward A",
          severity: "H",
          rcaStatus: "Draft",
          dueText: "ครบกำหนดวันนี้",
          linkUrl: "https://example.com/rm/incidents/1",
          patientName: "Jane Patient",
          patientHn: "123456",
          reporterName: "John Reporter",
        } as any,
      ],
      dashboardUrl: "https://example.com/dashboard",
      rcaUrl: "https://example.com/rm/rca",
    });

    expect(rendered.html).toContain("INC-0001");
    expect(rendered.html).not.toContain("Jane Patient");
    expect(rendered.html).not.toContain("123456");
    expect(rendered.html).not.toContain("John Reporter");
  });
});
