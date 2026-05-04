import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { unitSchema } from "@/lib/validators";

export async function GET() {
  try { await requireUser(["Admin"]); return Response.json(await prisma.unit.findMany({ orderBy: { name: "asc" } })); }
  catch (error) { return apiError(error); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = unitSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.unit.create({ data: { ...parsed.data, type: parsed.data.type || "หน่วยงาน" } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "Unit", entityId: item.id, newValue: JSON.stringify(item) } });
    return Response.json(item, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const body = await req.json();
    const parsed = unitSchema.partial().safeParse(body);
    if (!body.id || !parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const old = await prisma.unit.findUnique({ where: { id: body.id } });
    const item = await prisma.unit.update({ where: { id: body.id }, data: parsed.data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "Unit", entityId: item.id, oldValue: JSON.stringify(old), newValue: JSON.stringify(item) } });
    return Response.json(item);
  } catch (error) { return apiError(error); }
}
export async function DELETE(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const item = await prisma.unit.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "DEACTIVATE", entityType: "Unit", entityId: item.id } });
    return Response.json(item);
  } catch (error) { return apiError(error); }
}
