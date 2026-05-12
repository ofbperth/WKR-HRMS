import { cookies } from "next/headers";
import { apiError, requireUser, SESSION_COOKIE } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { refreshSessionUnit } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { unitId } = await request.json().catch(() => ({}));
    if (!unitId || typeof unitId !== "string") return Response.json({ error: "UNIT_REQUIRED" }, { status: 400 });
    const unit = await prisma.unit.findFirst({ where: { id: unitId, isActive: true } });
    if (!unit) return Response.json({ error: "UNIT_NOT_FOUND" }, { status: 404 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { unitId } });
    await auditLog({ userId: user.id, action: "USER_UNIT_SELECTED", entityType: "User", entityId: user.id, newValue: { unitId, unitName: unit.name } });
    const oldToken = cookies().get(SESSION_COOKIE)?.value;
    const token = await refreshSessionUnit(oldToken, updated.unitId);
    const res = Response.json({ ok: true, unitId });
    if (token) {
      res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 8}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    }
    return res;
  } catch (error) {
    return apiError(error);
  }
}

