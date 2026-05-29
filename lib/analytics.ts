import { prisma } from "@/lib/prisma";
import { SEVERITY_VALUES } from "@/lib/types";
import { countableIncidentFilter } from "@/lib/prisma-fields";
import { bangkokMonthKey } from "@/lib/reporting-date";

const highSeverity = ["E", "F", "G", "H", "I"];

export async function getIncidentAnalytics() {
  const incidents = await prisma.incident.findMany({
    where: countableIncidentFilter(),
    include: { incidentUnit: true, riskCode: true },
    orderBy: { occurredAt: "desc" },
    take: 1000,
  });

  const bySeverity = SEVERITY_VALUES.map(severity => ({
    severity,
    count: incidents.filter((item: any) => item.severity === severity).length,
  }));

  const unitMap = new Map<string, { unit: string; total: number; high: number; sentinel: number; open: number }>();
  const categoryMap = new Map<string, { category: string; total: number; high: number; sentinel: number }>();
  const monthMap = new Map<string, { month: string; total: number; high: number; sentinel: number }>();
  const heatmap = new Map<string, { unit: string; severity: string; count: number }>();

  for (const item of incidents as any[]) {
    const unit = item.incidentUnit?.name ?? "Unknown";
    const category = item.simpleCategory || item.riskCode?.simpleCategory || "Unclassified";
    const month = bangkokMonthKey(item.occurredAt);
    const isHigh = highSeverity.includes(item.severity);

    const unitValue = unitMap.get(unit) ?? { unit, total: 0, high: 0, sentinel: 0, open: 0 };
    unitValue.total += 1;
    if (isHigh) unitValue.high += 1;
    if (item.isSentinel) unitValue.sentinel += 1;
    if (item.status !== "Closed" && item.status !== "Rejected") unitValue.open += 1;
    unitMap.set(unit, unitValue);

    const categoryValue = categoryMap.get(category) ?? { category, total: 0, high: 0, sentinel: 0 };
    categoryValue.total += 1;
    if (isHigh) categoryValue.high += 1;
    if (item.isSentinel) categoryValue.sentinel += 1;
    categoryMap.set(category, categoryValue);

    const monthValue = monthMap.get(month) ?? { month, total: 0, high: 0, sentinel: 0 };
    monthValue.total += 1;
    if (isHigh) monthValue.high += 1;
    if (item.isSentinel) monthValue.sentinel += 1;
    monthMap.set(month, monthValue);

    const heatKey = `${unit}:${item.severity}`;
    const heatValue = heatmap.get(heatKey) ?? { unit, severity: item.severity, count: 0 };
    heatValue.count += 1;
    heatmap.set(heatKey, heatValue);
  }

  return {
    total: incidents.length,
    open: incidents.filter((item: any) => item.status !== "Closed" && item.status !== "Rejected").length,
    high: incidents.filter((item: any) => highSeverity.includes(item.severity)).length,
    sentinel: incidents.filter((item: any) => item.isSentinel).length,
    bySeverity,
    byUnit: Array.from(unitMap.values()).sort((a, b) => b.total - a.total),
    byCategory: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    byMonth: Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
    heatmap: Array.from(heatmap.values()),
  };
}

