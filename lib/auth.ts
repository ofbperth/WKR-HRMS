import { cookies } from "next/headers";
import { isRole, type Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, verifySessionToken, type SessionUser } from "@/lib/session";

export { SESSION_COOKIE, signSession, verifySessionToken };
export type { SessionUser };

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id }, include: { unit: true } });
  if (!user || !user.isActive || !isRole(user.role)) return null;
  return user as typeof user & { role: Role };
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  return Response.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}
