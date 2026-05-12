import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import { roleHome } from "@/lib/rbac";
import { exchangeGoogleCode, resolveGoogleLogin, verifyGoogleIdToken } from "@/lib/google-auth";
import { isRole } from "@/lib/types";

function loginErrorUrl(request: Request, error: string) {
  return new URL(`/login?error=${encodeURIComponent(error)}`, request.url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(/(?:^|;\s*)google_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || !cookieState || decodeURIComponent(cookieState) !== state) {
    return NextResponse.redirect(loginErrorUrl(request, "google_state_invalid"));
  }

  try {
    const idToken = await exchangeGoogleCode(code);
    const profile = await verifyGoogleIdToken(idToken);
    const user = await resolveGoogleLogin(profile);
    const rawRole: unknown = user.role;
    const role = typeof rawRole === "string" && isRole(rawRole) ? rawRole : null;
    if (!role) return NextResponse.redirect(loginErrorUrl(request, "USER_ROLE_INVALID"));
    const token = await signSession({ id: user.id, email: user.email, name: user.name, role, unitId: user.unitId });
    const next = !user.unitId && (user.authProvider === "GOOGLE" || user.authProvider === "BOTH") ? "/onboarding/unit" : roleHome[role];
    const res = NextResponse.redirect(new URL(`/pdpa?next=${encodeURIComponent(next)}`, request.url));
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
    res.cookies.delete("google_oauth_state");
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "google_login_failed";
    return NextResponse.redirect(loginErrorUrl(request, message));
  }
}
