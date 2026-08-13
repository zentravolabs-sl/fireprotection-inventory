"use client";

// ============================================================
// src/hooks/usePermissions.ts
// Reusable client hook for UI permission checks.
// ============================================================

import { usePermissionContext } from "@/components/providers/PermissionProvider";

export function usePermissions() {
  const { permissions, userRole, can, canAny, canAll } = usePermissionContext();

  return {
    permissions,
    userRole,
    can,
    canAny,
    canAll,
    isSuperAdmin: userRole === "SUPER_ADMIN",
    isAdmin: userRole === "ADMIN" || userRole === "SUPER_ADMIN",
  };
}
