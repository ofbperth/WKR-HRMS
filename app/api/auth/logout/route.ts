import { NextResponse } from "next/server";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) await prisma.auditLog.create({ data: { userId: user.id, action: "LOGOUT", entityType: "User", entityId: user.id } });
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
