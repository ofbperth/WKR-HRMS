import { prisma } from "@/lib/prisma";

const sensitiveKeys = new Set([
  "passwordHash",
  "patientHn",
  "patientAn",
  "hnEncrypted",
  "anEncrypted",
  "rcaEncrypted",
  "reporterNameEncrypted",
  "reporterName",
  "googleId",
]);

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitiveKeys.has(key) ? "[REDACTED]" : redactSensitive(item),
    ]),
  );
}

function stringifyAuditValue(value: unknown) {
  return JSON.stringify(redactSensitive(value));
}

export async function auditLog(input: {
  userId?: string | null;
  role?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      userRole: input.role ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? null,
      oldValue: input.oldValue === undefined ? null : stringifyAuditValue(input.oldValue),
      newValue: input.newValue === undefined ? null : stringifyAuditValue(input.newValue),
    } as any,
  });
}
