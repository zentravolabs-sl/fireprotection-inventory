"use client";

// ============================================================
// src/components/providers/PermissionProvider.tsx
// Client-side React context delivering active user permission keys.
// ============================================================

import React, { createContext, useContext, useMemo } from "react";
import type { UserRole } from "@/types/auth";

interface PermissionContextValue {
  permissions: Set<string>;
  userRole: UserRole;
  can: (permissionKey: string) => boolean;
  canAny: (permissionKeys: string[]) => boolean;
  canAll: (permissionKeys: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: new Set(),
  userRole: "USER",
  can: () => false,
  canAny: () => false,
  canAll: () => false,
});

export function PermissionProvider({
  permissions: rawPermissions,
  userRole,
  children,
}: {
  permissions: string[];
  userRole: UserRole;
  children: React.ReactNode;
}) {
  const permissionsSet = useMemo(() => new Set(rawPermissions), [rawPermissions]);

  const value = useMemo(() => {
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    const can = (permissionKey: string): boolean => {
      if (isSuperAdmin) return true;
      return permissionsSet.has(permissionKey);
    };

    const canAny = (permissionKeys: string[]): boolean => {
      if (isSuperAdmin) return true;
      return permissionKeys.some((key) => permissionsSet.has(key));
    };

    const canAll = (permissionKeys: string[]): boolean => {
      if (isSuperAdmin) return true;
      return permissionKeys.every((key) => permissionsSet.has(key));
    };

    return {
      permissions: permissionsSet,
      userRole,
      can,
      canAny,
      canAll,
    };
  }, [permissionsSet, userRole]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  return useContext(PermissionContext);
}
