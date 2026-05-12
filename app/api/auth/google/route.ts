import { NextResponse } from "next/server";
import { getAuthSettings } from "@/lib/auth-settings";
import { getGoogleClientConfig } from "@/lib/google-auth";

export async function GET(request: Request) {
  let settings;
  try {
    settings = await getAuthSettings();
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_needs_migration", request.url));
  }
  if (!settings.googleEnabled) return NextResponse.redirect(new URL("/login?error=google_disabled", request.url));
  const { clientId, redirectUri } = getGoogleClientConfig();
  if (!clientId) return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url);
  res.cookies.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 10 });
  return res;
}
