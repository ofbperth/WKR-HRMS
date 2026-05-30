import { getFiscalYearRange, getLast12MonthsRange, getThisMonthRange, type AnalyticsFilters } from "@/lib/dashboard-analytics";
import { bangkokDateKey } from "@/lib/reporting-date";

function dateOnly(date: Date) {
  return bangkokDateKey(date);
}

export function normalizeDashboardSearchParams(searchParams: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const preset = typeof searchParams.preset === "string" ? searchParams.preset : "last12";
  const filters: AnalyticsFilters = {};
  if (preset === "thisMonth") {
    const range = getThisMonthRange();
    filters.startDate = dateOnly(range.start);
    filters.endDate = dateOnly(range.end);
  } else if (preset === "fiscalYear") {
    const range = getFiscalYearRange();
    filters.startDate = dateOnly(range.start);
    filters.endDate = dateOnly(range.end);
  } else if (preset === "last12") {
    const range = getLast12MonthsRange();
    filters.startDate = dateOnly(range.start);
    filters.endDate = dateOnly(range.end);
  } else {
    if (typeof searchParams.startDate === "string") filters.startDate = searchParams.startDate;
    if (typeof searchParams.endDate === "string") filters.endDate = searchParams.endDate;
  }
  for (const key of ["unitId", "clinicalOrGeneral", "includeClosed"] as const) {
    if (typeof searchParams[key] === "string") filters[key] = searchParams[key];
  }
  if (typeof searchParams.simpleCategory === "string") filters.simpleCategory = searchParams.simpleCategory;
  if (Array.isArray(searchParams.simpleCategory)) filters.simpleCategory = searchParams.simpleCategory.filter(Boolean);
  if (typeof searchParams.yMode === "string") filters.yMode = searchParams.yMode;
  return filters;
}

export function dashboardSearchParamsFromUrl(url: string) {
  const params = new URL(url).searchParams;
  const searchParams: Record<string, string | string[] | undefined> = {};
  params.forEach((value, key) => {
    const existing = searchParams[key];
    if (existing === undefined) {
      const values = params.getAll(key);
      searchParams[key] = values.length > 1 ? values : value;
    }
  });
  return searchParams;
}

