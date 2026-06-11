import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { roleHome } from "@/lib/rbac";
import { isRole, type Role } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive || !isRole(user.role) || !user.passwordHash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const role = user.role as Role;
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  try {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  } catch (error) {
    console.warn("Unable to update lastLoginAt", error);
  }
  try {
    await auditLog({ userId: user.id, role: user.role, action: "LOGIN_CREDENTIALS_SUCCESS", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role } });
  } catch (error) {
    console.warn("Unable to write login audit log", error);
  }
  const token = await signSession({ id: user.id, email: user.email, name: user.name, role, unitId: user.unitId });
  const next = !user.unitId ? "/onboarding/unit" : roleHome[role];
  const res = NextResponse.json({ ok: true, redirectTo: `/pdpa?next=${encodeURIComponent(next)}` });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
