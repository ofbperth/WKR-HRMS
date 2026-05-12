import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { getAuthSettings, isGoogleEmailAllowed } from "@/lib/auth-settings";
import { isRole, type Role } from "@/lib/types";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { clientId, clientSecret, redirectUri: `${baseUrl.replace(/\/$/, "")}/api/auth/callback/google` };
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleClientConfig();
  if (!clientId || !clientSecret) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  const token = await res.json() as { id_token?: string };
  if (!token.id_token) throw new Error("GOOGLE_ID_TOKEN_MISSING");
  return token.id_token;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const { clientId } = getGoogleClientConfig();
  if (!clientId) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, { issuer: GOOGLE_ISSUER, audience: clientId });
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  if (!payload.sub || !email) throw new Error("GOOGLE_PROFILE_INCOMPLETE");
  return {
    sub: String(payload.sub),
    email,
    email_verified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

function nextProvider(existing: string | null | undefined) {
  return existing === "CREDENTIALS" ? "BOTH" : existing === "BOTH" ? "BOTH" : "GOOGLE";
}

export async function resolveGoogleLogin(profile: GoogleProfile) {
  const settings = await getAuthSettings();
  if (!settings.googleEnabled) throw new Error("GOOGLE_LOGIN_DISABLED");
  if (!profile.email_verified) throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");

  if (!isGoogleEmailAllowed(profile.email, settings)) {
    await auditLog({ action: "LOGIN_GOOGLE_DENIED_DOMAIN", entityType: "User", newValue: { email: profile.email } });
    throw new Error("GOOGLE_DOMAIN_NOT_ALLOWED");
  }

  const existing = await prisma.user.findUnique({ where: { email: profile.email }, include: { unit: true } });
  if (existing) {
    if (!existing.isActive) throw new Error("USER_INACTIVE");
    if (!isRole(existing.role)) throw new Error("USER_ROLE_INVALID");
    const linked = await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: profile.sub,
        authProvider: nextProvider(existing.authProvider),
        image: profile.picture ?? existing.image,
        lastLoginAt: new Date(),
      },
      include: { unit: true },
    });
    if (!existing.googleId) await auditLog({ userId: linked.id, action: "GOOGLE_ACCOUNT_LINKED", entityType: "User", entityId: linked.id, newValue: { email: linked.email } });
    await auditLog({ userId: linked.id, action: "LOGIN_GOOGLE_SUCCESS", entityType: "User", entityId: linked.id, newValue: { email: linked.email, role: linked.role } });
    return linked as typeof linked & { role: Role };
  }

  const invite = await prisma.userInvite.findUnique({ where: { email: profile.email } });
  if (invite && invite.status === "Pending" && invite.expiresAt > new Date() && isRole(invite.role)) {
    const user = await prisma.user.create({
      data: {
        name: profile.name || profile.email,
        email: profile.email,
        role: invite.role,
        unitId: invite.unitId,
        isActive: true,
        authProvider: "GOOGLE",
        googleId: profile.sub,
        image: profile.picture ?? null,
        lastLoginAt: new Date(),
      },
      include: { unit: true },
    });
    await prisma.userInvite.update({ where: { id: invite.id }, data: { status: "Accepted", acceptedAt: new Date() } });
    await auditLog({ userId: user.id, action: "USER_INVITE_ACCEPTED", entityType: "UserInvite", entityId: invite.id, newValue: { email: user.email, role: user.role } });
    await auditLog({ userId: user.id, action: "LOGIN_GOOGLE_SUCCESS", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role } });
    return user as typeof user & { role: Role };
  }

  if (!settings.allowAutoProvision) {
    await auditLog({ action: "LOGIN_GOOGLE_DENIED_AUTOPROVISION", entityType: "User", newValue: { email: profile.email } });
    throw new Error("GOOGLE_USER_NOT_REGISTERED");
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name || profile.email,
      email: profile.email,
      role: settings.defaultRole,
      isActive: settings.defaultIsActive,
      authProvider: "GOOGLE",
      googleId: profile.sub,
      image: profile.picture ?? null,
      lastLoginAt: new Date(),
    },
    include: { unit: true },
  });
  await auditLog({ userId: user.id, action: "USER_GOOGLE_AUTO_PROVISIONED", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role, isActive: user.isActive, requiresUnitSelection: true } });
  if (!user.isActive) throw new Error("GOOGLE_USER_PENDING_APPROVAL");
  await auditLog({ userId: user.id, action: "LOGIN_GOOGLE_SUCCESS", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role, autoProvisioned: true, requiresUnitSelection: true } });
  return user as typeof user & { role: Role };
}
