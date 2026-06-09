import { prisma } from "@/lib/prisma";
import { countableIncidentFilter } from "@/lib/prisma-fields";
import { bangkokDayDiff } from "@/lib/reporting-date";
import { severityWeights } from "@/lib/severity";
import { statusLabel } from "@/lib/format";

export type RcaReminderBucket = "OVERDUE" | "DUE_1" | "DUE_3" | "DUE_7" | "LATER";

export type ActionRequiredItem = {
  incidentId: string;
  incidentNo: string;
  unit: string;
  severity: string;
  rcaStatus: string;
  dueText: string;
  dueBucket: RcaReminderBucket;
  dueDays: number;
  dueAt: Date;
};

export type RcaReminderSummary = {
  pending: number;
  dueWithin7Days: number;
  dueWithin3Days: number;
  dueWithin1Day: number;
  overdue: number;
  actionItems: ActionRequiredItem[];
};

export function classifyRcaReminderBucket(diffDays: number): RcaReminderBucket {
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 1) return "DUE_1";
  if (diffDays <= 3) return "DUE_3";
  if (diffDays <= 7) return "DUE_7";
  return "LATER";
}

export function formatRcaDueText(diffDays: number) {
  if (diffDays < 0) return `เกินกำหนด ${Math.abs(diffDays)} วัน`;
  if (diffDays === 0) return "ครบกำหนดวันนี้";
  return `ครบกำหนดใน ${diffDays} วัน`;
}

export function formatRcaReminderStatus(rcaStatus: string | null | undefined) {
  if (!rcaStatus) return "ยังไม่เริ่ม RCA";
  return statusLabel(rcaStatus);
}

export function sortActionRequiredItems(items: ActionRequiredItem[]) {
  const bucketPriority: Record<RcaReminderBucket, number> = {
    OVERDUE: 0,
    DUE_1: 1,
    DUE_3: 2,
    DUE_7: 3,
    LATER: 4,
  };
  return [...items].sort((left, right) => {
    const bucketDiff = bucketPriority[left.dueBucket] - bucketPriority[right.dueBucket];
    if (bucketDiff !== 0) return bucketDiff;
    const severityDiff = (severityWeights[right.severity] ?? 0) - (severityWeights[left.severity] ?? 0);
    if (severityDiff !== 0) return severityDiff;
    return left.dueAt.getTime() - right.dueAt.getTime();
  });
}

export function selectActionRequiredItems(items: ActionRequiredItem[], limit = 10) {
  return sortActionRequiredItems(items).filter((item) => item.dueBucket !== "LATER").slice(0, limit);
}

export async function getRcaReminderSummary(input?: { unitId?: string | null; now?: Date }) {
  const now = input?.now ?? new Date();
  const where = countableIncidentFilter({
    ...(input?.unitId ? { incidentUnitId: input.unitId } : {}),
    rcaDueAt: { not: null },
    status: { in: ["RCARequired", "RCASubmitted"] },
    OR: [{ rca: null }, { rca: { status: { in: ["Draft", "RevisionRequired"] } } }],
  });

  const rows = await prisma.incident.findMany({
    where,
    select: {
      id: true,
      incidentNo: true,
      severity: true,
      rcaDueAt: true,
      incidentUnit: { select: { name: true } },
      rca: { select: { status: true } },
    },
    orderBy: [{ rcaDueAt: "asc" }, { id: "asc" }],
  });

  const items = rows
    .filter((item) => item.rcaDueAt)
    .map((item) => {
      const dueAt = item.rcaDueAt as Date;
      const dueDays = bangkokDayDiff(dueAt, now);
      const dueBucket = classifyRcaReminderBucket(dueDays);
      return {
        incidentId: item.id,
        incidentNo: item.incidentNo,
        unit: item.incidentUnit.name,
        severity: item.severity,
        rcaStatus: formatRcaReminderStatus(item.rca?.status),
        dueText: formatRcaDueText(dueDays),
        dueBucket,
        dueDays,
        dueAt,
      } satisfies ActionRequiredItem;
    });

  return {
    pending: items.length,
    dueWithin7Days: items.filter((item) => item.dueDays >= 0 && item.dueDays <= 7).length,
    dueWithin3Days: items.filter((item) => item.dueDays >= 0 && item.dueDays <= 3).length,
    dueWithin1Day: items.filter((item) => item.dueDays >= 0 && item.dueDays <= 1).length,
    overdue: items.filter((item) => item.dueDays < 0).length,
    actionItems: selectActionRequiredItems(items, 10),
  } satisfies RcaReminderSummary;
}
