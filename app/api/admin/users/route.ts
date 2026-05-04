import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { adminUserSchema } from "@/lib/validators";

function stripPassword<T extends { passwordHash?: string }>(item: T) {
  const { passwordHash, ...safe } = item;
  return safe;
}

export async function GET() {
  try {
    await requireUser(["Admin"]);
    const users = await prisma.user.findMany({ include: { unit: true }, orderBy: { createdAt: "desc" } });
    return Response.json(users.map(stripPassword));
  } catch (error) { return apiError(error); }
}

export async function POST(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const parsed = adminUserSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || !parsed.data.password) return Response.json({ error: "Invalid input or password required" }, { status: 400 });
    const { password, unitId, ...rest } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const item = await prisma.user.create({ data: { ...rest, unitId: unitId || null, passwordHash }, include: { unit: true } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "CREATE", entityType: "User", entityId: item.id, newValue: JSON.stringify({ email: item.email, role: item.role }) } });
    return Response.json(stripPassword(item), { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const body = await req.json();
    const parsed = adminUserSchema.partial().safeParse(body);
    if (!body.id || !parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const { password, unitId, ...rest } = parsed.data;
    const data: any = { ...rest };
    if (unitId !== undefined) data.unitId = unitId || null;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    const old = await prisma.user.findUnique({ where: { id: body.id } });
    const item = await prisma.user.update({ where: { id: body.id }, data, include: { unit: true } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE", entityType: "User", entityId: item.id, oldValue: JSON.stringify(old), newValue: JSON.stringify({ email: item.email, role: item.role, isActive: item.isActive }) } });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}

export async function DELETE(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const item = await prisma.user.update({ where: { id }, data: { isActive: false }, include: { unit: true } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "DEACTIVATE", entityType: "User", entityId: item.id } });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}
