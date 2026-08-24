// ============================================================
// src/lib/auth/permissions.ts
// Central Server-Side Permission & Authorization Service (PBAC/RBAC)
//
// Source of truth for all UI, Page, Server Action, and API guards.
// ============================================================

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { UserRole, SessionUser } from "@/types/auth";

/**
 * Request-cached fetch of the current authenticated user's permissions.
 * Loads all RolePermission keys for the user's role in a single DB call.
 */
export const getCurrentUserPermissions = cache(async (): Promise<Set<string>> => {
  const session = await getSession();
  if (!session?.user || session.user.isActive === false) {
    return new Set();
  }

  const role = session.user.role as UserRole;

  // SUPER_ADMIN has full permissions across all modules automatically
  if (role === "SUPER_ADMIN") {
    const allPermissions = await prisma.permission.findMany({
      select: { key: true },
    });
    return new Set(allPermissions.map((p) => p.key));
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    select: {
      permission: {
        select: { key: true },
      },
    },
  });

  return new Set(rolePermissions.map((rp) => rp.permission.key));
});

/**
 * Returns an array of permission keys for passing to Client Components / Providers.
 */
export const getCurrentUserPermissionsList = cache(async (): Promise<string[]> => {
  const permSet = await getCurrentUserPermissions();
  return Array.from(permSet);
});

/**
 * Non-redirecting server-side check if a user has a specific permission key.
 * Automatically returns true for SUPER_ADMIN.
 */
export async function hasPermission(
  userId: string | undefined | null,
  permissionKey: string
): Promise<boolean> {
  const session = await getSession();
  if (!session?.user || session.user.isActive === false) {
    return false;
  }

  // Verify target user ID matches authenticated user if provided
  if (userId && session.user.id !== userId) {
    return false;
  }

  const role = session.user.role as UserRole;
  if (role === "SUPER_ADMIN") {
    return true;
  }

  const permissions = await getCurrentUserPermissions();
  return permissions.has(permissionKey);
}

/**
 * Checks project-level assignment access for a specific user.
 * - SUPER_ADMIN, ADMIN, GENERAL_MANAGER, ACCOUNTANT have global project access.
 * - PROJECT_MANAGER & ENGINEER must be assigned to the project.
 */
export async function hasProjectAccess(
  userId: string,
  projectId: number
): Promise<boolean> {
  const session = await getSession();
  if (!session?.user || session.user.isActive === false) {
    return false;
  }

  const role = session.user.role as UserRole;

  // Global management & overview roles can access all projects
  if (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "CEO" ||
    role === "GENERAL_MANAGER" ||
    role === "ACCOUNTANT" ||
    role === "INVENTORY_CONTROLLER" ||
    role === "PURCHASE_ENGINEER" ||
    role === "QS_ENGINEER"
  ) {
    return true;
  }

  // Check direct Project Manager assignment
  const project = await prisma.project.findFirst({
    where: { id: projectId, projectManagerId: userId },
    select: { id: true },
  });
  if (project) return true;

  // Check Project Engineer assignment
  const engineerAssignment = await prisma.projectEngineer.findFirst({
    where: { projectId, engineerId: userId },
    select: { id: true },
  });
  if (engineerAssignment) return true;

  // Check active Project Staff assignment
  const staffAssignment = await prisma.projectStaff.findFirst({
    where: { projectId, userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (staffAssignment) return true;

  return false;
}

/**
 * Checks both global permission key AND project-level assignment access.
 */
export async function canForProject(
  userId: string,
  permissionKey: string,
  projectId: number
): Promise<boolean> {
  const permOk = await hasPermission(userId, permissionKey);
  if (!permOk) return false;
  return hasProjectAccess(userId, projectId);
}

/**
 * Server guard — ensures the current user is authenticated and possesses the permission.
 * Throws an Error or redirects if ungranted.
 */
export async function requirePermission(permissionKey: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  const user = session.user as SessionUser;
  const allowed = await hasPermission(user.id, permissionKey);

  if (!allowed) {
    throw new Error(`FORBIDDEN: Missing required permission '${permissionKey}'`);
  }

  return user;
}

/**
 * Server guard — ensures current user has permission AND project access.
 */
export async function requireProjectPermission(
  permissionKey: string,
  projectId: number
): Promise<SessionUser> {
  const user = await requirePermission(permissionKey);
  const projectOk = await hasProjectAccess(user.id, projectId);

  if (!projectOk) {
    throw new Error(
      `FORBIDDEN: You do not have access to manage Project #${projectId}`
    );
  }

  return user;
}
