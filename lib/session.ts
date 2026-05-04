import { jwtVerify, SignJWT } from "jose";
import { isRole, type Role } from "@/lib/types";

export const SESSION_COOKIE = "hrms_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

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
    .sign(secret);
}

export async function verifySessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.id || typeof payload.role !== "string" || !isRole(payload.role)) return null;
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
