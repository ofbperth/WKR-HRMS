import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signedExportRedirect } from "@/lib/export-route";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";

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
    const { page, pageSize, skip, take } = getPagingParams(url);
    if (!exportCsv) {
      const [data, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.auditLog.count({ where }),
      ]);
      return Response.json({ data, meta: buildPageMeta(page, pageSize, total) });
    }
    return signedExportRedirect(request, { kind: "audit-log-csv", user, filters: { ...(action ? { action } : {}), ...(entityType ? { entityType } : {}) } });
  } catch (error) {
    return apiError(error);
  }
}
