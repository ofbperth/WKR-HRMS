"use client";

import { CategoryPieChart, RateLineChart, SentinelEventList, SeverityBarChart, TopRiskCodeBarChart, TrendLineChart, UnitRankingChart } from "@/components/dashboard/charts";
import { DashboardChartsSkeleton } from "@/components/dashboard/dashboard-charts-skeleton";

type DashboardVariant = "rm" | "unit" | "executive";

export function DashboardChartPanels({ variant, data }: { variant: DashboardVariant; data: any }) {
  if (!data?.charts) return <DashboardChartsSkeleton />;

  if (variant === "unit") {
    const basePath = "/unit/incidents";
    return <div className="dashboard-chart-grid">
      <TrendLineChart title="Trend incident รายเดือนของหน่วยงาน" data={data.charts.trend} />
      <SeverityBarChart title="Severity distribution ของหน่วยงาน" data={data.charts.severity} drilldown={{ basePath, param: "severity", field: "name" }} />
      <TopRiskCodeBarChart title="Top risk code ของหน่วยงาน" data={data.charts.topRiskCodes} drilldown={{ basePath, param: "riskCodeId", field: "riskCodeId" }} />
      <CategoryPieChart title="Action status ของหน่วยงาน" data={data.charts.actionStatus} />
      <CategoryPieChart title="RCA status ของหน่วยงาน" data={data.charts.rcaStatus} />
    </div>;
  }

  if (variant === "executive") {
    return <div className="dashboard-chart-grid">
      <TrendLineChart title="Trend incident รายเดือน" data={data.charts.trend} />
      <SeverityBarChart title="การกระจาย Severity A-I" data={data.charts.severity} drilldown={{ basePath: "/rm/search", param: "severity", field: "name" }} />
      <CategoryPieChart title="Clinical vs General" data={data.charts.clinicalGeneral} drilldown={{ basePath: "/rm/search", param: "clinicalOrGeneral", field: "name" }} />
      <TopRiskCodeBarChart title="Top 10 risk code" data={data.charts.topRiskCodes} drilldown={{ basePath: "/rm/search", param: "riskCodeId", field: "riskCodeId" }} />
      <UnitRankingChart title="Top 10 หน่วยงานตามจำนวน incident" data={data.charts.topUnits} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} />
      <UnitRankingChart title="Top 10 หน่วยงานตาม weighted risk score" data={data.charts.weightedUnits} score drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} />
      <UnitRankingChart title="RCA ที่เปิดอยู่ตามหน่วยงาน" data={data.charts.openRcaByUnit} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} />
      <UnitRankingChart title="แผนแก้ไขเกินกำหนดตามหน่วยงาน" data={data.charts.overdueActionByUnit} drilldown={{ basePath: "/rm/search", param: "unitId", field: "unitId" }} />
    </div>;
  }

  return <div className="dashboard-chart-grid">
    <SeverityBarChart title="Incident ตาม status" data={data.charts.status} drilldown={{ basePath: "/rm/search", param: "status", field: "name" }} />
    <SeverityBarChart title="Incident ตาม severity" data={data.charts.severity} drilldown={{ basePath: "/rm/search", param: "severity", field: "name" }} />
    <CategoryPieChart title="Clinical vs General risk" data={data.charts.clinicalGeneral} drilldown={{ basePath: "/rm/search", param: "clinicalOrGeneral", field: "name" }} />
    <TrendLineChart title="Trend incident รายเดือน" data={data.charts.trend} />
    <TopRiskCodeBarChart title="Incident ตาม SIMPLE category" data={data.charts.simpleCategory} labelKey="category" drilldown={{ basePath: "/rm/search", param: "simpleCategory", field: "category" }} />
    <TopRiskCodeBarChart title="Top 5 risk ที่เกิดซ้ำ" data={data.charts.topRecurrentRiskCodes} drilldown={{ basePath: "/rm/search", param: "riskCodeId", field: "riskCodeId" }} />
    <CategoryPieChart title="สัดส่วน status ของ RCA" data={data.charts.rcaStatus} />
    <CategoryPieChart title="สัดส่วน status ของ Action" data={data.charts.actionStatus} />
    <TrendLineChart title="Trend severity E-I รายเดือน" data={data.charts.trend} high />
    <RateLineChart title="Trend %Rate near miss (Incident A-B/Total)" data={data.charts.trend} />
    <SentinelEventList title="Sentinel event 5 รายการล่าสุด" data={data.charts.lastSentinelEvents} />
  </div>;
}
