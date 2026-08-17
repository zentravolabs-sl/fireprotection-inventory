// ============================================================
// src/proxy.ts  (replaces deprecated src/middleware.ts)
// Next.js 16 Proxy — Optimistic route protection.
// Authoritative authentication & RBAC is enforced server-side
// in protected layouts and pages.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_ROUTES = ["/dashboard", "/admin", "/super-admin", "/cost-approvals"];
const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auth pages — let them render normally without DB lookup
  if (matchesRoute(pathname, AUTH_PAGES)) {
    return NextResponse.next();
  }

  // 2. Protected routes — optimistic session-cookie check
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: "cdnfire",
    });

    if (!sessionCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Public / unmapped routes — continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};

