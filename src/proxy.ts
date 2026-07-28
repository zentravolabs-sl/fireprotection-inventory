// ============================================================
// src/proxy.ts  (replaces deprecated src/middleware.ts)
// Next.js 16 Proxy — Route protection and role-based access.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTHENTICATED_ROUTES = ["/dashboard"];
const ADMIN_ROUTES = ["/admin"];
const SUPER_ADMIN_ROUTES = ["/super-admin"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiresAuth = matchesRoute(pathname, AUTHENTICATED_ROUTES) ||
    matchesRoute(pathname, ADMIN_ROUTES) ||
    matchesRoute(pathname, SUPER_ADMIN_ROUTES);

  const isAuthPage = matchesRoute(pathname, AUTH_PAGES);

  // Early return if the route requires no session check
  if (!requiresAuth && !isAuthPage) {
    return NextResponse.next();
  }

  // Fetch session only when visiting protected routes or auth pages
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session;
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "USER";

  // Already authenticated visiting auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Super Admin routes
  if (matchesRoute(pathname, SUPER_ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Admin routes
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Authenticated-only routes
  if (matchesRoute(pathname, AUTHENTICATED_ROUTES)) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};
