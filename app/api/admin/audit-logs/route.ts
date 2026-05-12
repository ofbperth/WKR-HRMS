import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signedExportRedirect } from "@/lib/export-route";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const url = new URL(request.url);
    const exportCsv = url.searchParams.get("export") === "csv";
    const action = url.searchParams.get("action")?.trim();
    const entityType = url.searchParams.get("entityType")?.trim();
    const where = {
      ...(action ? { action: { contains: action } } : {}),
      ...(entityType ? { entityType } : {}),
    };
    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: exportCsv ? 1000 : 200,
    });
    if (!exportCsv) return Response.json(logs);
    return signedExportRedirect(request, { kind: "audit-log-csv", user, filters: { ...(action ? { action } : {}), ...(entityType ? { entityType } : {}) } });
  } catch (error) {
    return apiError(error);
  }
}
