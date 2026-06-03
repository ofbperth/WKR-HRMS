import "server-only";
import { randomUUID } from "crypto";
import { auditLog } from "@/lib/audit";
import type { ExportKind } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { assertExportScope, scopeForExport } from "@/lib/export-scope";
import { createSignedExportToken, exportTtlSeconds, signedExportUrl, type SignedExportFilters } from "@/lib/signed-export";

type ExportUser = { id: string; role: string; unitId: string | null };

const exportRateLimitWindowMs = 30 * 60 * 1000;

const exportRateLimitByRole: Record<string, number> = {
  Reporter: 3,
  UnitManager: 10,
  RMTeam: 20,
  Admin: 30,
};

function nowPlusSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

async function assertExportRateLimit(user: ExportUser) {
  const limit = exportRateLimitByRole[user.role] ?? 5;
  const windowStart = new Date(Date.now() - exportRateLimitWindowMs);
  const recentCount = await (prisma as any).exportAccessGrant.count({
    where: {
      userId: user.id,
      createdAt: { gte: windowStart },
    },
  });
  if (recentCount >= limit) throw new Error("EXPORT_RATE_LIMITED");
}

async function assertExportRateLimitTx(tx: any, user: ExportUser) {
  const limit = exportRateLimitByRole[user.role] ?? 5;
  const windowStart = new Date(Date.now() - exportRateLimitWindowMs);
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, `export-rate-limit:${user.id}`);
  const recentCount = await tx.exportAccessGrant.count({
    where: {
      userId: user.id,
      createdAt: { gte: windowStart },
    },
  });
  if (recentCount >= limit) throw new Error("EXPORT_RATE_LIMITED");
}

export async function issueGovernedExport(request: Request, input: {
  kind: ExportKind;
  user: ExportUser;
  reason: string;
  filters?: SignedExportFilters;
}) {
  const filters = input.filters ?? {};
  assertExportScope(input.kind, input.user, filters);

  const tokenJti = randomUUID();
  const expiresAt = nowPlusSeconds(exportTtlSeconds());
  const scope = scopeForExport(input.kind, input.user, filters);
  const grant = await prisma.$transaction(async (tx) => {
    await assertExportRateLimitTx(tx as any, input.user);
    return (tx as any).exportAccessGrant.create({
      data: {
        userId: input.user.id,
        kind: input.kind,
        role: input.user.role,
        unitId: input.user.unitId,
        reason: input.reason,
        filtersJson: JSON.stringify(filters),
        scope,
        tokenJti,
        expiresAt,
      },
    });
  });
  const token = await createSignedExportToken({
    kind: input.kind,
    userId: input.user.id,
    role: input.user.role,
    unitId: input.user.unitId,
    grantId: grant.id,
    tokenJti,
    filters,
  });
  await auditLog({
    userId: input.user.id,
    role: input.user.role,
    action: "EXPORT_SIGNED_URL_ISSUED",
    entityType: "Export",
    entityId: grant.id,
    newValue: {
      kind: input.kind,
      reason: input.reason,
      scope,
      expiresInSeconds: exportTtlSeconds(),
      filters,
    },
  });
  return signedExportUrl(request.url, token);
}

export async function validateExportDownload(input: {
  user: ExportUser;
  kind: ExportKind;
  role: string;
  grantId: string | null;
  tokenJti: string | null;
  filters: SignedExportFilters;
}) {
  if (!input.grantId || !input.tokenJti) throw new Error("INVALID_EXPORT_TOKEN");
  const grant = await (prisma as any).exportAccessGrant.findUnique({
    where: { id: input.grantId },
  });
  if (!grant) throw new Error("EXPORT_GRANT_NOT_FOUND");
  if (grant.userId !== input.user.id || grant.role !== input.role || grant.kind !== input.kind || grant.tokenJti !== input.tokenJti) {
    throw new Error("EXPORT_SCOPE_FORBIDDEN");
  }
  if (new Date(grant.expiresAt).getTime() < Date.now()) {
    throw new Error("INVALID_OR_EXPIRED_SIGNED_URL");
  }
  if (JSON.stringify(input.filters ?? {}) !== String(grant.filtersJson ?? "{}")) {
    throw new Error("EXPORT_SCOPE_FORBIDDEN");
  }
  return grant as {
    id: string;
    reason: string;
    scope: string;
    downloadedAt?: Date | null;
  };
}

export async function markExportDownloaded(grantId: string) {
  return (prisma as any).exportAccessGrant.update({
    where: { id: grantId },
    data: { downloadedAt: new Date() },
  });
}
