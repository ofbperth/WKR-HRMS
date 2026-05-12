import { jwtVerify, SignJWT } from "jose";
import { isRole, type Role } from "@/lib/types";

export const SESSION_COOKIE = "hrms_session";

function getSessionSecret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && !value) throw new Error("AUTH_SECRET_REQUIRED");
  return new TextEncoder().encode(value || "dev-secret-change-me");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  unitId: string | null;
};

export async function signSession(user: SessionUser) {
  return new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSessionSecret());
}

export async function verifySessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!payload.id || typeof payload.role !== "string" || !isRole(payload.role)) return null;
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function refreshSessionUnit(token: string | undefined, unitId: string | null) {
  const session = await verifySessionToken(token);
  if (!session) return null;
  return signSession({ ...session, unitId });
}
