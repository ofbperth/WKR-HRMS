import "server-only";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export const cacheTtlMs = {
  temporaryExport: 1000 * 60 * 60 * 24,
  dashboard: 1000 * 60 * 60 * 24,
  search: 1000 * 60 * 60 * 24,
  monthlySummary: 1000 * 60 * 60 * 24 * 10,
} as const;

type CacheType = keyof typeof cacheTtlMs;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export function buildCacheKey(input: {
  cacheType: CacheType;
  unitId?: string | null;
  dateRange?: { from?: string | null; to?: string | null };
  reportType?: string | null;
  filters?: Record<string, unknown>;
  role?: string | null;
}) {
  const scope = {
    cacheType: input.cacheType,
    unitId: input.unitId ?? null,
    dateRange: input.dateRange ?? null,
    reportType: input.reportType ?? null,
    filters: input.filters ?? {},
    role: input.role ?? null,
  };
  return createHash("sha256").update(stableStringify(scope)).digest("hex");
}

export async function getCachedValue<T>(cacheKey: string): Promise<T | null> {
  const entry = await (prisma as any).cacheEntry.findUnique({ where: { cacheKey } });
  if (!entry || new Date(entry.expiresAt) <= new Date()) return null;
  return JSON.parse(entry.payloadJson) as T;
}

export async function setCachedValue(input: {
  cacheType: CacheType;
  cacheKey: string;
  payload: unknown;
  unitId?: string | null;
  reportType?: string | null;
  filters?: Record<string, unknown>;
}) {
  const expiresAt = new Date(Date.now() + cacheTtlMs[input.cacheType]);
  return (prisma as any).cacheEntry.upsert({
    where: { cacheKey: input.cacheKey },
    update: {
      payloadJson: JSON.stringify(input.payload),
      filtersJson: stableStringify(input.filters ?? {}),
      expiresAt,
    },
    create: {
      cacheKey: input.cacheKey,
      cacheType: input.cacheType,
      unitId: input.unitId ?? null,
      reportType: input.reportType ?? null,
      filtersJson: stableStringify(input.filters ?? {}),
      payloadJson: JSON.stringify(input.payload),
      expiresAt,
    },
  });
}

export async function getOrSetCachedValue<T>(input: {
  cacheType: CacheType;
  unitId?: string | null;
  dateRange?: { from?: string | null; to?: string | null };
  reportType?: string | null;
  filters?: Record<string, unknown>;
  role?: string | null;
  loader: () => Promise<T>;
}) {
  const cacheKey = buildCacheKey(input);
  const cached = await getCachedValue<T>(cacheKey);
  if (cached) return cached;
  const payload = await input.loader();
  await setCachedValue({
    cacheType: input.cacheType,
    cacheKey,
    payload,
    unitId: input.unitId,
    reportType: input.reportType,
    filters: input.filters,
  });
  return payload;
}

export async function invalidateSmartCache(cacheTypes: CacheType[] = ["dashboard", "search", "monthlySummary"]) {
  try {
    await (prisma as any).cacheEntry.deleteMany({
      where: { cacheType: { in: cacheTypes } },
    });
  } catch (error) {
    console.error("Smart cache invalidation failed", error);
  }
}
