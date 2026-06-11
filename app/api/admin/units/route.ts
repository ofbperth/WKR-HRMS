import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { unitSchema } from "@/lib/validators";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";

export async function GET(req: Request) {
  try {
    await requireUser(["Admin"]);
    const url = new URL(req.url);
    if (url.searchParams.get("all") === "1") {
      const activeOnly = url.searchParams.get("active") === "1";
      return Response.json(
        await prisma.unit.findMany({
          where: {
            ...(activeOnly ? { isActive: true } : {}),
            NOT: { type: "ทีม" },
          },
          orderBy: { name: "asc" },
        }),
      );
    }
    const { page, pageSize, skip, take } = getPagingParams(url);
    const [data, total] = await prisma.$transaction([
      prisma.unit.findMany({ where: { NOT: { type: "ทีม" } }, orderBy: { name: "asc" }, skip, take }),
      prisma.unit.count({ where: { NOT: { type: "ทีม" } } }),
    ]);
    return Response.json({ data, meta: buildPageMeta(page, pageSize, total) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = unitSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.unit.create({ data: { ...parsed.data, type: "หน่วยงาน" } });
    await auditLog({ userId: user.id, role: user.role, action: "CREATE", entityType: "Unit", entityId: item.id, newValue: item });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const body = await req.json();
    const parsed = unitSchema.partial().safeParse(body);
    if (!body.id || !parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const old = await prisma.unit.findUnique({ where: { id: body.id } });
    const item = await prisma.unit.update({
      where: { id: body.id },
      data: {
        ...parsed.data,
        ...(parsed.data.name !== undefined || parsed.data.isActive !== undefined ? { type: "หน่วยงาน" } : {}),
      },
    });
    await auditLog({ userId: user.id, role: user.role, action: "UPDATE", entityType: "Unit", entityId: item.id, oldValue: old, newValue: item });
    return Response.json(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const item = await prisma.unit.update({ where: { id }, data: { isActive: false } });
    await auditLog({ userId: user.id, role: user.role, action: "DEACTIVATE", entityType: "Unit", entityId: item.id });
    return Response.json(item);
  } catch (error) {
    return apiError(error);
  }
}
