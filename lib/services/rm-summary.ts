import { prisma } from "@/lib/prisma";
import { countableIncidentFilter } from "@/lib/prisma-fields";
import { bangkokNowMinusDays } from "@/lib/reporting-date";
import { formatDateOnly } from "@/lib/format";
import { isHighSeverityForType } from "@/lib/severity";

export type WeeklyIncidentSummary = {
  windowStart: Date;
  windowEnd: Date;
  windowLabel: string;
  newIncidents: number;
  highSeverityIncidents: number;
  sentinelIncidents: number;
  topRiskGroups: Array<{ label: string; value: number }>;
};

export async function getWeeklyIncidentSummary(input?: { unitId?: string | null; now?: Date }) {
  const now = input?.now ?? new Date();
  const windowStart = bangkokNowMinusDays(7, now);
  const windowEnd = now;
  const where = countableIncidentFilter({
    occurredAt: { gte: windowStart, lte: windowEnd },
    ...(input?.unitId ? { incidentUnitId: input.unitId } : {}),
  });

  const [incidents, groupedRiskGroupsRaw] = await Promise.all([
    prisma.incident.findMany({
      where,
      select: {
        severity: true,
        clinicalOrGeneral: true,
        isSentinel: true,
      },
    }),
    prisma.incident.groupBy({
      by: ["simpleCategory"],
      where,
      _count: true,
    } as any),
  ]);

  const groupedRiskGroups = groupedRiskGroupsRaw as Array<{ simpleCategory: string; _count?: { _all?: number } | number }>;

  return {
    windowStart,
    windowEnd,
    windowLabel: `${formatDateOnly(windowStart)} - ${formatDateOnly(windowEnd)}`,
    newIncidents: incidents.length,
    highSeverityIncidents: incidents.filter((item) => isHighSeverityForType(item.severity, item.clinicalOrGeneral)).length,
    sentinelIncidents: incidents.filter((item) => item.isSentinel).length,
    topRiskGroups: groupedRiskGroups
      .map((item) => ({
        label: item.simpleCategory || "ไม่ระบุหมวดความเสี่ยง",
        value: typeof item._count === "number" ? item._count : item._count?._all ?? 0,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
  } satisfies WeeklyIncidentSummary;
}
