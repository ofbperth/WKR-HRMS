import { containsLikelyPatientIdentifier, redactSensitiveText } from "@/lib/pdpa-guard";
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
  "problemStatement",
  "timeline",
  "rootCause",
  "preventiveAction",
  "evidenceText",
  "message",
  "reason",
]);

function redactSensitive(value: unknown): unknown {
  if (typeof value === "string") {
    return containsLikelyPatientIdentifier(value) ? redactSensitiveText(value) : value;
  }
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitiveKeys.has(key) ? "[REDACTED]" : redactSensitive(item),
    ]),
  );
}

export function redactAuditValue(value: unknown) {
  return redactSensitive(value);
}

function stringifyAuditValue(value: unknown) {
  return JSON.stringify(redactSensitive(value));
}

type AuditInput = {
  userId?: string | null;
  role?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
};

export async function writeAuditLog(client: any, input: AuditInput) {
  return client.auditLog.create({
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

export async function auditLog(input: AuditInput) {
  return writeAuditLog(prisma, input);
}

function valueContainsSensitiveContent(value: unknown): boolean {
  if (typeof value === "string") {
    if (value.includes("[REDACTED]") || value.includes("[REDACTED_PHONE]") || value.includes("[REDACTED_ID]")) return false;
    return containsLikelyPatientIdentifier(value);
  }
  if (Array.isArray(value)) return value.some(valueContainsSensitiveContent);
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some(valueContainsSensitiveContent);
}

export function auditRecordHasSensitiveContent(value: string | null | undefined) {
  if (!value) return false;
  try {
    return valueContainsSensitiveContent(JSON.parse(value));
  } catch {
    return valueContainsSensitiveContent(value);
  }
}

export function scanAuditRecordForSensitiveData(record: { id: string; oldValue?: string | null; newValue?: string | null }) {
  return {
    id: record.id,
    hasSensitiveOldValue: auditRecordHasSensitiveContent(record.oldValue),
    hasSensitiveNewValue: auditRecordHasSensitiveContent(record.newValue),
  };
}
