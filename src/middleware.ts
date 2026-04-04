import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Layer 1: Fast cookie presence check.
 * Does NOT validate the cookie's value — that happens at the layout level
 * when AuthProvider calls GET /me.
 *
 * Public routes (/login, /setup, /join) are always accessible.
 * Protected routes require the login_code cookie.
 */

const PUBLIC_PATHS = ["/login", "/setup", "/join"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const loginCode = request.cookies.get("login_code");
  if (!loginCode) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
