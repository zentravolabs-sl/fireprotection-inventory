// ============================================================
// src/lib/session.ts
// Server-side session helpers for Server Components and Actions.
//
// These utilities use `better-auth`'s API directly with the
// incoming request headers — no client-side JS involved.
// ============================================================

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

/**
 * Fetches the current session from the Better Auth API.
 * Returns `null` if no valid session exists.
 * Wrapped in React `cache()` to deduplicate per request.
 */
export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session ?? null;
  } catch (error) {
    console.error("Failed to retrieve auth session:", error);
    return null;
  }
});

/**
 * Returns the current session, redirecting to `/login` if unauthenticated.
 *
 * Use this in protected Server Components / layouts.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Validates the session AND checks that the user has one of the
 * required roles. Redirects to `/dashboard` if role is insufficient.
 *
 * @param roles - Allowed roles. Pass multiple to allow any of them.
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireSession();
  const userRole = (session.user as { role?: UserRole }).role ?? "USER";

  if (!roles.includes(userRole)) {
    // User is authenticated but lacks the required role.
    redirect("/dashboard");
  }

  return session;
}

/**
 * Returns `true` if the current user has at least one of the given roles.
 * Does NOT redirect — use inside Server Components for conditional rendering.
 */
export async function hasRole(...roles: UserRole[]): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const userRole = (session.user as { role?: UserRole }).role ?? "USER";
  return roles.includes(userRole);
}
