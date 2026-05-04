import { prisma } from "@/lib/prisma";

export async function auditLog(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue === undefined ? null : JSON.stringify(input.oldValue),
      newValue: input.newValue === undefined ? null : JSON.stringify(input.newValue),
    },
  });
}
