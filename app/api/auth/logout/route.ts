import { NextResponse } from "next/server";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) {
    try {
      await prisma.auditLog.create({ data: { userId: user.id, userRole: user.role, action: "LOGOUT", entityType: "User", entityId: user.id } as any });
    } catch (error) {
      console.warn("Unable to write logout audit log", error);
    }
  }
  const res = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
