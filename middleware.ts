import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { canAccessApiPath, canAccessPath, roleHome } from "@/lib/rbac";

const publicPaths = ["/login"];
const publicApiPrefixes = ["/api/auth/login", "/api/auth/logout"];

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
  if (pathname === "/" || pathname === "/dashboard") return NextResponse.redirect(new URL(roleHome[session.role], request.url));
  if (!canAccessPath(session.role, pathname)) return NextResponse.redirect(new URL(roleHome[session.role], request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"] };
