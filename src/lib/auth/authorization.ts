// ============================================================
// src/lib/auth/authorization.ts
// Server-side authorization helpers for the ERP.
//
// Every protected server action and server component should
// call one of these helpers FIRST before executing any logic.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

// ── Role hierarchy (higher index = more privilege) ──────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  ENGINEER: 1,
  PROJECT_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Returns the current session user without redirecting.
 * Returns null if unauthenticated or inactive.
 */
async function getActiveSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const user = session.user as {
    id: string;
    role?: UserRole;
    isActive?: boolean;
  };

  // Block inactive users even if session cookie is valid
  if (user.isActive === false) return null;

  return {
    id: user.id,
    role: (user.role ?? "USER") as UserRole,
    isActive: user.isActive ?? true,
  };
}

/**
 * requireAuth — must be authenticated and active.
 * Redirects to /login if unauthenticated, /dashboard if inactive.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    role?: UserRole;
    isActive?: boolean;
  };

  if (user.isActive === false) {
    // Inactive users are redirected to login with an error
    redirect("/login?error=account_inactive");
  }

  return {
    id: user.id,
    role: (user.role ?? "USER") as UserRole,
    isActive: user.isActive ?? true,
  };
}

/**
 * requireRole — must be authenticated, active, and have the exact role.
 * Redirects to /dashboard if role is insufficient.
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * requireAnyRole — must be authenticated, active, and have one of the given roles.
 * Redirects to /dashboard if role is insufficient.
 *
 * @example
 * await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
 */
export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * canManageRole — returns true if the actor can assign/manage the target role.
 *
 * Rules:
 * - SUPER_ADMIN can manage all roles including SUPER_ADMIN.
 * - ADMIN can manage roles up to ADMIN (not SUPER_ADMIN).
 * - Others cannot manage any roles.
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;

  // Actor must be ADMIN or above, and must have strictly higher privilege than target
  // Exception: SUPER_ADMIN can manage other SUPER_ADMINs
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorLevel < ROLE_HIERARCHY["ADMIN"]) return false;
  return actorLevel > targetLevel;
}

/**
 * hasAnyRole — non-redirecting check for conditional server-component rendering.
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getActiveSessionUser();
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * getRoleLevel — returns numeric hierarchy level for a role.
 * Higher = more privilege.
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}
