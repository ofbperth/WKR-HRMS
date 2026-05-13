import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { adminUserSchema } from "@/lib/validators";

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

async function countUserHistory(userId: string) {
  const [
    reportedIncidents,
    reviewedIncidents,
    closedIncidents,
    rcaKpiOwner,
    rcaApproved,
    actionOwned,
    actionVerified,
    comments,
    attachments,
    notifications,
    auditLogs,
    invitesSent,
  ] = await Promise.all([
    prisma.incident.count({ where: { reportedById: userId } }),
    prisma.incident.count({ where: { reviewedById: userId } }),
    prisma.incident.count({ where: { closedById: userId } }),
    prisma.rCA.count({ where: { kpiOwnerId: userId } }),
    prisma.rCA.count({ where: { approvedById: userId } }),
    prisma.actionPlan.count({ where: { ownerId: userId } }),
    prisma.actionPlan.count({ where: { verifiedById: userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.attachment.count({ where: { uploadedById: userId } }),
    prisma.notification.count({ where: { userId } }),
    prisma.auditLog.count({ where: { userId } }),
    prisma.userInvite.count({ where: { invitedById: userId } }),
  ]);
  return reportedIncidents + reviewedIncidents + closedIncidents + rcaKpiOwner + rcaApproved + actionOwned + actionVerified + comments + attachments + notifications + auditLogs + invitesSent;
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
    if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const { password, unitId, ...rest } = parsed.data;
    if (isProtectedAdmin(rest.email)) {
      rest.role = "Admin";
      rest.isActive = true;
    }
    if ((rest.authProvider ?? "CREDENTIALS") !== "GOOGLE" && !password) return Response.json({ error: "Password required for credentials login" }, { status: 400 });
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;
    const item = await prisma.user.create({ data: { ...rest, unitId: unitId || null, passwordHash, authProvider: rest.authProvider ?? "CREDENTIALS" }, include: { unit: true } });
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
    await prisma.auditLog.create({ data: { userId: actor.id, action: "UPDATE", entityType: "User", entityId: item.id, oldValue: JSON.stringify(auditUserValue(old)), newValue: JSON.stringify(auditUserValue(item)) } });
    if (old && old.role !== item.role) await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_ROLE_CHANGED", entityType: "User", entityId: item.id, oldValue: JSON.stringify({ role: old.role }), newValue: JSON.stringify({ role: item.role }) } });
    if (old && old.isActive && !item.isActive) await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_DEACTIVATED", entityType: "User", entityId: item.id } });
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
      const historyCount = await countUserHistory(id);
      if (historyCount > 0) return Response.json({ error: "USER_HAS_HISTORY" }, { status: 409 });
      await prisma.user.delete({ where: { id } });
      await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_HARD_DELETED", entityType: "User", entityId: id, oldValue: JSON.stringify(auditUserValue(old)) } });
      return Response.json({ ok: true, id });
    }
    const item = await prisma.user.update({ where: { id }, data: { isActive: false }, include: { unit: true } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_DEACTIVATED", entityType: "User", entityId: item.id } });
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
    await prisma.auditLog.create({ data: { userId: actor.id, action: "GOOGLE_ACCOUNT_UNLINKED", entityType: "User", entityId: item.id, oldValue: JSON.stringify({ googleId: old.googleId }), newValue: JSON.stringify({ email: item.email }) } });
    return Response.json(stripPassword(item));
  } catch (error) { return apiError(error); }
}
