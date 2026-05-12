import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { userInviteSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser(["Admin"]);
    const invites = await prisma.userInvite.findMany({ include: { unit: true, invitedBy: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } });
    return Response.json(invites);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = userInviteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
    const expiresAt = new Date(parsed.data.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return Response.json({ error: "INVALID_EXPIRES_AT" }, { status: 400 });
    const invite = await prisma.userInvite.upsert({
      where: { email: parsed.data.email },
      update: { role: parsed.data.role, unitId: parsed.data.unitId || null, invitedById: user.id, status: "Pending", expiresAt, acceptedAt: null },
      create: { email: parsed.data.email, role: parsed.data.role, unitId: parsed.data.unitId || null, invitedById: user.id, expiresAt },
    });
    await auditLog({ userId: user.id, action: "USER_INVITE_CREATED", entityType: "UserInvite", entityId: invite.id, newValue: { email: invite.email, role: invite.role } });
    return Response.json(invite, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const { id } = await request.json().catch(() => ({}));
    if (!id) return Response.json({ error: "ID_REQUIRED" }, { status: 400 });
    const invite = await prisma.userInvite.update({ where: { id }, data: { status: "Revoked" } });
    await auditLog({ userId: user.id, action: "USER_INVITE_REVOKED", entityType: "UserInvite", entityId: invite.id, newValue: { email: invite.email } });
    return Response.json(invite);
  } catch (error) {
    return apiError(error);
  }
}

