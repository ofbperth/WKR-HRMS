import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
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
  if (error instanceof ZodError) return Response.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return Response.json({ error: "CONFLICT" }, { status: 409 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return Response.json({ error: "DB_RELATION_BLOCKED" }, { status: 409 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2011", "P2014"].includes(error.code)) {
    return Response.json({ error: "DB_SCHEMA_NOT_READY" }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  return Response.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}
