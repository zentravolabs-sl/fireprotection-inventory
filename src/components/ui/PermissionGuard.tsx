"use client";

// ============================================================
// src/components/ui/PermissionGuard.tsx
// Client Component — renders children only when the logged-in
// user holds at least one of the specified roles.
//
// Reads role from PermissionProvider context (zero extra fetches).
//
// Usage:
//   <PermissionGuard roles={["ADMIN", "SUPER_ADMIN"]}>
//     <SensitiveContent />
//   </PermissionGuard>
// ============================================================

import type { ReactNode } from "react";
import type { UserRole } from "@/types/auth";
import { usePermissionContext } from "@/components/providers/PermissionProvider";

interface PermissionGuardProps {
  /** One or more roles that are allowed to see the children. */
  roles: UserRole[];
  /** Content to render when the user has the required role. */
  children: ReactNode;
  /** Optional fallback rendered when the user lacks permission. Defaults to null. */
  fallback?: ReactNode;
}

/**
 * PermissionGuard — Client Component
 *
 * Conditionally renders `children` based on the current user's role
 * from the nearest PermissionProvider context.
 * Returns `fallback` (default: null) when the user is unauthenticated
 * or does not hold any of the specified roles.
 *
 * @example
 * // Show an "Edit" button only to admins
 * <PermissionGuard roles={["ADMIN", "SUPER_ADMIN"]}>
 *   <EditButton />
 * </PermissionGuard>
 *
 * @example
 * // Show a message to unauthorised users
 * <PermissionGuard roles={["ENGINEER"]} fallback={<p>Access denied.</p>}>
 *   <EngineerPanel />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  roles,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { userRole } = usePermissionContext();
  const allowed = roles.includes(userRole);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}