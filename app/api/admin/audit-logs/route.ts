import { apiError, requireUser } from "@/lib/auth";
import { createExportJob } from "@/lib/export-jobs";
import { prisma } from "@/lib/prisma";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";
import { exportRequestSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const url = new URL(request.url);
    const action = url.searchParams.get("action")?.trim();
    const entityType = url.searchParams.get("entityType")?.trim();
    const where = {
      ...(action ? { action: { contains: action } } : {}),
      ...(entityType ? { entityType } : {}),
    };
    const { page, pageSize, skip, take } = getPagingParams(url);
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
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const body = exportRequestSchema.parse(await request.json());
    const job = await createExportJob({
      request,
      kind: "audit-log-csv",
      user,
      reason: body.reason,
      filters: body.filters,
    });
    return Response.json({ jobId: job.id, status: job.status });
  } catch (error) {
    if (error instanceof Error && error.message === "EXPORT_RATE_LIMITED") return Response.json({ error: "EXPORT_RATE_LIMITED" }, { status: 429 });
    return apiError(error);
  }
}
