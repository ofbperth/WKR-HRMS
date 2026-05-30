export const REPORTING_TIME_ZONE = "Asia/Bangkok";

const BANGKOK_UTC_OFFSET_HOURS = 7;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const monthOnlyPattern = /^(\d{4})-(\d{2})$/;

type DateParts = { year: number; month: number; day: number };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateOnly(value?: string): DateParts | null {
  if (!value) return null;
  const match = dateOnlyPattern.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

function bangkokDateTimeToUtc(parts: DateParts, hour: number, minute: number, second: number, millisecond: number) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour - BANGKOK_UTC_OFFSET_HOURS, minute, second, millisecond));
}

export function bangkokStartOfDay(value?: string) {
  const parts = parseDateOnly(value);
  return parts ? bangkokDateTimeToUtc(parts, 0, 0, 0, 0) : undefined;
}

export function bangkokEndOfDay(value?: string) {
  const parts = parseDateOnly(value);
  return parts ? bangkokDateTimeToUtc(parts, 23, 59, 59, 999) : undefined;
}

export function bangkokDateRangeFilter(from?: string, to?: string) {
  const start = bangkokStartOfDay(from);
  const end = bangkokEndOfDay(to);
  return start || end ? { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } : undefined;
}

export function bangkokMonthRange(year: number, month: number) {
  const start = bangkokDateTimeToUtc({ year, month, day: 1 }, 0, 0, 0, 0);
  const nextMonth = month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
  const exclusiveEnd = bangkokDateTimeToUtc(nextMonth, 0, 0, 0, 0);
  const end = new Date(exclusiveEnd.getTime() - 1);
  return { start, end, exclusiveEnd };
}

export function bangkokMonthInputToRange(value: string | undefined, fallback = new Date()) {
  if (!value || !monthOnlyPattern.test(value)) {
    const fallbackMonth = bangkokMonthKey(fallback);
    const [year, month] = fallbackMonth.split("-").map(Number);
    return { year, month, ...bangkokMonthRange(year, month) };
  }
  const [year, month] = value.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const fallbackMonth = bangkokMonthKey(fallback);
    const [fallbackYear, fallbackMonthNumber] = fallbackMonth.split("-").map(Number);
    return { year: fallbackYear, month: fallbackMonthNumber, ...bangkokMonthRange(fallbackYear, fallbackMonthNumber) };
  }
  return { year, month, ...bangkokMonthRange(year, month) };
}

export function bangkokDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORTING_TIME_ZONE,
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return `${get("year")}-${pad(get("month"))}-${pad(get("day"))}`;
}

export function bangkokMonthKey(value: Date | string) {
  return bangkokDateKey(value).slice(0, 7);
}

export function bangkokThisMonthRange(now = new Date()) {
  const [year, month] = bangkokMonthKey(now).split("-").map(Number);
  return bangkokMonthRange(year, month);
}

export function bangkokFiscalYearRange(now = new Date(), fiscalYearStartMonth = 10) {
  const [currentYear, currentMonth] = bangkokMonthKey(now).split("-").map(Number);
  const startYear = currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1;
  const start = bangkokMonthRange(startYear, fiscalYearStartMonth).start;
  const exclusiveEnd = bangkokMonthRange(startYear + 1, fiscalYearStartMonth).start;
  return { start, end: new Date(exclusiveEnd.getTime() - 1), exclusiveEnd };
}

export function bangkokLast12MonthsRange(now = new Date()) {
  const [currentYear, currentMonth] = bangkokMonthKey(now).split("-").map(Number);
  const startMonthIndex = currentYear * 12 + currentMonth - 12;
  const startYear = Math.floor(startMonthIndex / 12);
  const startMonth = (startMonthIndex % 12) + 1;
  const start = bangkokMonthRange(startYear, startMonth).start;
  const exclusiveEnd = bangkokMonthRange(currentMonth === 12 ? currentYear + 1 : currentYear, currentMonth === 12 ? 1 : currentMonth + 1).start;
  return { start, end: new Date(exclusiveEnd.getTime() - 1), exclusiveEnd };
}
