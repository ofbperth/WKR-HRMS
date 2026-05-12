import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { canAccessApiPath, canAccessPath, roleHome } from "@/lib/rbac";

const publicPaths = ["/login"];
const publicApiPrefixes = ["/api/auth/login", "/api/auth/logout", "/api/auth/google", "/api/auth/callback/google"];
const unitOnboardingPaths = ["/onboarding/unit", "/api/onboarding/unit", "/api/auth/me", "/api/notifications"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || publicApiPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (pathname.startsWith("/api")) {
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (!canAccessApiPath(session.role, pathname)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.next();
  }

  if (publicPaths.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL(roleHome[session.role], request.url));
    return NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  if (!session.unitId && unitOnboardingPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (!session.unitId && !pathname.startsWith("/api") && pathname !== "/pdpa") return NextResponse.redirect(new URL("/onboarding/unit", request.url));
  if (!session.unitId && pathname.startsWith("/api")) return NextResponse.json({ error: "USER_UNIT_REQUIRED" }, { status: 428 });
  if (pathname === "/" || pathname === "/dashboard") return NextResponse.redirect(new URL(roleHome[session.role], request.url));
  if (!canAccessPath(session.role, pathname)) return NextResponse.redirect(new URL(roleHome[session.role], request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"] };
