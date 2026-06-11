import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { teamSchema } from "@/lib/validators";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";

export async function GET(req: Request) {
  try {
    await requireUser(["Admin"]);
    const url = new URL(req.url);
    if (url.searchParams.get("all") === "1") {
      const activeOnly = url.searchParams.get("active") === "1";
      return Response.json(await prisma.team.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }));
    }
    const { page, pageSize, skip, take } = getPagingParams(url);
    const [data, total] = await prisma.$transaction([
      prisma.team.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], skip, take }),
      prisma.team.count(),
    ]);
    return Response.json({ data, meta: buildPageMeta(page, pageSize, total) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = teamSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.team.create({
      data: {
        ...parsed.data,
        code: parsed.data.code || null,
        description: parsed.data.description || null,
      },
    });
    await auditLog({ userId: user.id, role: user.role, action: "CREATE", entityType: "Team", entityId: item.id, newValue: item });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const body = await req.json().catch(() => null);
    const parsed = teamSchema.partial().safeParse(body);
    if (!body?.id || !parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const old = await prisma.team.findUnique({ where: { id: body.id } });
    const item = await prisma.team.update({
      where: { id: body.id },
      data: {
        ...parsed.data,
        code: parsed.data.code === undefined ? undefined : parsed.data.code || null,
        description: parsed.data.description === undefined ? undefined : parsed.data.description || null,
      },
    });
    await auditLog({ userId: user.id, role: user.role, action: "UPDATE", entityType: "Team", entityId: item.id, oldValue: old, newValue: item });
    return Response.json(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const { id } = await req.json().catch(() => ({}));
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const item = await prisma.team.update({ where: { id }, data: { isActive: false } });
    await auditLog({ userId: user.id, role: user.role, action: "DEACTIVATE", entityType: "Team", entityId: item.id });
    return Response.json(item);
  } catch (error) {
    return apiError(error);
  }
}
