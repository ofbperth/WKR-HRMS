import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) {
    try {
      await auditLog({ userId: user.id, role: user.role, action: "LOGOUT", entityType: "User", entityId: user.id });
    } catch (error) {
      console.warn("Unable to write logout audit log", error);
    }
  }
  const res = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
