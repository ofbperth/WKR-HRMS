import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { buildExport } from "@/lib/export-builders";
import { verifySignedExportToken } from "@/lib/signed-export";

function canDownload(kind: string, role: string) {
  if (kind === "audit-log-csv") return role === "Admin";
  if (kind === "rca-csv") return ["UnitManager", "RMTeam", "Admin"].includes(role);
  if (kind === "incident-csv" || kind === "action-csv") return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  return false;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "SIGNED_URL_REQUIRED" }, { status: 400 });

  try {
    const signed = await verifySignedExportToken(token);
    if (signed.userId !== user.id || signed.role !== user.role) {
      await auditLog({ userId: user.id, role: user.role, action: "EXPORT_SIGNED_URL_DENIED", entityType: "Export", newValue: { kind: signed.kind } });
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (!canDownload(signed.kind, user.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const built = await buildExport(signed.kind, { id: user.id, role: user.role, unitId: user.unitId }, signed.filters);
    await auditLog({ userId: user.id, role: user.role, action: "EXPORT_SIGNED_URL_DOWNLOAD", entityType: "Export", newValue: { kind: signed.kind, count: built.count } });
    return new Response(built.body, {
      headers: {
        "Content-Type": built.contentType,
        "Content-Disposition": `attachment; filename="${built.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    await auditLog({ userId: user.id, role: user.role, action: "EXPORT_SIGNED_URL_INVALID", entityType: "Export" });
    return NextResponse.json({ error: "INVALID_OR_EXPIRED_SIGNED_URL" }, { status: 403 });
  }
}
