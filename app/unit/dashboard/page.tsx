import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { LinkedStatCard } from "@/components/dashboard/stat-cards";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { getDashboardSummary, getFiscalYearRange, getThisMonthRange } from "@/lib/dashboard-analytics";
import { normalizeDashboardSearchParams } from "@/lib/dashboard-filter";

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeHref(basePath: string, range: { start: Date; end: Date }) {
  return `${basePath}?from=${dateOnly(range.start)}&to=${dateOnly(range.end)}`;
}

export default async function UnitDashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardSummary({ ...normalizeDashboardSearchParams(searchParams), scopeUnitId: user.unitId });
  const basePath = "/unit/incidents";
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Unit Dashboard</h1><p className="text-sm text-slate-600">Incident, RCA และ action status เฉพาะหน่วยงานของคุณ</p></div>
    <DashboardFilter units={data.filters.units} categories={data.filters.categories} showUnit={false} />
    <div className="dashboard-stat-grid">
      <LinkedStatCard title="เดือนนี้" value={data.cards.totalThisMonth} href={rangeHref(basePath, getThisMonthRange())} />
      <LinkedStatCard title="ปีงบประมาณ" value={data.cards.totalFiscalYear} href={rangeHref(basePath, getFiscalYearRange())} />
      <LinkedStatCard title="RCA ที่เปิดอยู่" value={data.cards.openRca} href={`${basePath}?status=RCARequired`} />
      <LinkedStatCard title="RCA revision" value={data.cards.rcaRevisionRequired} href="/unit/rca" />
      <LinkedStatCard title="Action ที่เปิดอยู่" value={data.cards.openActions} href="/unit/actions" />
      <LinkedStatCard title="Action overdue" value={data.cards.overdueActions} href="/unit/actions" />
      <LinkedStatCard title="Severity สูงสุด" value={data.cards.highestSeverity || "-"} href={`${basePath}?severity=${data.cards.highestSeverityLabel || ""}`} />
      <LinkedStatCard title="อัตราปิดเคส" value={`${data.cards.closedCaseRate}%`} href={`${basePath}?status=Closed`} />
    </div>
    <DashboardChartsSection variant="unit" />
  </div></AppShell>;
}
