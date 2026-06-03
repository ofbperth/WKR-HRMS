import "server-only";
import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";
import type { ExportKind } from "@/lib/export-builders";
import { createSignedExportToken, exportTtlSeconds, signedExportUrl, type SignedExportFilters } from "@/lib/signed-export";

export async function signedExportRedirect(request: Request, input: {
  kind: ExportKind;
  user: { id: string; role: string; unitId: string | null };
  grantId: string;
  tokenJti: string;
  filters?: SignedExportFilters;
}) {
  const token = await createSignedExportToken({
    kind: input.kind,
    userId: input.user.id,
    role: input.user.role,
    unitId: input.user.unitId,
    grantId: input.grantId,
    tokenJti: input.tokenJti,
    filters: input.filters,
  });
  const url = signedExportUrl(request.url, token);
  await auditLog({
    userId: input.user.id,
    role: input.user.role,
    action: "EXPORT_SIGNED_URL_ISSUED",
    entityType: "Export",
    newValue: { kind: input.kind, expiresInSeconds: exportTtlSeconds(), filters: input.filters ?? {} },
  });
  return NextResponse.redirect(url);
}
