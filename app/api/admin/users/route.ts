import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { auditLog, writeAuditLog } from "@/lib/audit";
import { adminUserSchema } from "@/lib/validators";
import { encryptToStorage } from "@/lib/encryption";
import { buildPageMeta, getPagingParams } from "@/lib/server-pagination";

const protectedAdminEmail = "ofbperth@gmail.com";

function stripPassword<T extends { passwordHash?: string | null }>(item: T) {
  const { passwordHash, ...safe } = item;
  return safe;
}

function auditUserValue(user: { email: string; role: string; isActive: boolean; authProvider?: string | null; unitId?: string | null } | null) {
  if (!user) return null;
  return { email: user.email, role: user.role, isActive: user.isActive, authProvider: user.authProvider, unitId: user.unitId };
}

function isProtectedAdmin(email?: string | null) {
  return email?.trim().toLowerCase() === protectedAdminEmail;
}

export async function GET(req: Request) {
  try {
    await requireUser(["Admin"]);
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = getPagingParams(url);
    const authProvider = url.searchParams.get("authProvider")?.trim();
    const email = url.searchParams.get("email")?.trim();
    const where: any = {};
    if (authProvider) where.authProvider = authProvider;
    if (email) where.email = { contains: email, mode: "insensitive" };
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ where, include: { unit: true }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.user.count({ where }),
    ]);
    return Response.json({ data: users.map(stripPassword), meta: buildPageMeta(page, pageSize, total) });
  } catch (error) { return apiError(error); }
}

export async function POST(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const parsed = adminUserSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const { password, unitId, ...rest } = parsed.data;
    if (isProtectedAdmin(rest.email)) {
      rest.role = "Admin";
      rest.isActive = true;
    }
    if ((rest.authProvider ?? "CREDENTIALS") !== "GOOGLE" && !password) return Response.json({ error: "Password required for credentials login" }, { status: 400 });
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;
    const item = await prisma.user.create({ data: { ...rest, unitId: unitId || null, passwordHash, authProvider: rest.authProvider ?? "CREDENTIALS" }, include: { unit: true } });
    await auditLog({ userId: actor.id, role: actor.role, action: "CREATE", entityType: "User", entityId: item.id, newValue: { email: item.email, role: item.role } });
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
    const old = await prisma.user.findUnique({ where: { id: body.id } });
    if (!old) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (isProtectedAdmin(old.email) || isProtectedAdmin(rest.email)) {
      data.email = protectedAdminEmail;
      data.role = "Admin";
      data.isActive = true;
    }
    if (unitId !== undefined) data.unitId = unitId || null;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);
    const item = await prisma.user.update({ where: { id: body.id }, data, include: { unit: true } });
    await auditLog({ userId: actor.id, role: actor.role, action: "UPDATE", entityType: "User", entityId: item.id, oldValue: auditUserValue(old), newValue: auditUserValue(item) });
    if (old && old.role !== item.role) await auditLog({ userId: actor.id, role: actor.role, action: "USER_ROLE_CHANGED", entityType: "User", entityId: item.id, oldValue: { role: old.role }, newValue: { role: item.role } });
    if (old && old.isActive && !item.isActive) await auditLog({ userId: actor.id, role: actor.role, action: "USER_DEACTIVATED", entityType: "User", entityId: item.id });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}

export async function DELETE(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const { id, hardDelete } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    if (id === actor.id) return Response.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
    const old = await prisma.user.findUnique({ where: { id }, include: { unit: true } });
    if (!old) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (isProtectedAdmin(old.email)) return Response.json({ error: "PROTECTED_ADMIN" }, { status: 403 });
    if (hardDelete) {
      await prisma.$transaction(async (tx) => {
        await tx.incident.updateMany({
          where: { reportedById: id, reporterNameEncrypted: null },
          data: { reporterNameEncrypted: encryptToStorage(old.name) },
        });
        await tx.incident.updateMany({ where: { reportedById: id }, data: { reportedById: null } as any });
        await tx.incident.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } as any });
        await tx.incident.updateMany({ where: { closedById: id }, data: { closedById: null } as any });
        await tx.rCA.updateMany({ where: { kpiOwnerId: id }, data: { kpiOwnerId: null } });
        await tx.rCA.updateMany({ where: { approvedById: id }, data: { approvedById: null } });
        await tx.actionPlan.updateMany({ where: { ownerId: id }, data: { ownerId: null } as any });
        await tx.actionPlan.updateMany({ where: { verifiedById: id }, data: { verifiedById: null } as any });
        await tx.comment.updateMany({ where: { userId: id }, data: { userId: null } as any });
        await tx.attachment.updateMany({ where: { uploadedById: id }, data: { uploadedById: null } as any });
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.userInvite.updateMany({ where: { invitedById: id }, data: { invitedById: null } as any });
        await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } as any });
        await writeAuditLog(tx as any, { userId: actor.id, role: actor.role, action: "USER_HARD_DELETED", entityType: "User", entityId: id, oldValue: auditUserValue(old) });
        await tx.user.delete({ where: { id } });
      });
      return Response.json({ ok: true, id });
    }
    const item = await prisma.user.update({ where: { id }, data: { isActive: false }, include: { unit: true } });
    await auditLog({ userId: actor.id, role: actor.role, action: "USER_DEACTIVATED", entityType: "User", entityId: item.id });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireUser(["Admin"]);
    const { id, action } = await req.json().catch(() => ({}));
    if (!id || action !== "UNLINK_GOOGLE") return Response.json({ error: "Invalid input" }, { status: 400 });
    const old = await prisma.user.findUnique({ where: { id } });
    if (!old) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const authProvider = old.passwordHash ? "CREDENTIALS" : "GOOGLE";
    const item = await prisma.user.update({ where: { id }, data: { googleId: null, image: null, authProvider }, include: { unit: true } });
    await auditLog({ userId: actor.id, role: actor.role, action: "GOOGLE_ACCOUNT_UNLINKED", entityType: "User", entityId: item.id, oldValue: { googleId: old.googleId }, newValue: { email: item.email } });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}
