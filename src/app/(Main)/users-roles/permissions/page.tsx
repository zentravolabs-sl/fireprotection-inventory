// ============================================================
// src/app/(Main)/users-roles/permissions/page.tsx
// Role Permissions Management Page — Route: /users-roles/permissions
// Access: SUPER_ADMIN, ADMIN (permission: role.manage)
// ============================================================

import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getRolePermissionsMatrix } from "@/app/actions/user-actions";
import { RolePermissionMatrix } from "@/components/users/RolePermissionMatrix";
import { Shield, ArrowLeft } from "lucide-react";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Role Permissions — CDN Fire Engineering",
  description: "Configure system permissions for each access role.",
};

export default async function RolePermissionsPage() {
  const session = await requireSession();
  const actorRole = (session.user.role ?? "USER") as UserRole;

  const matrixResult = await getRolePermissionsMatrix();

  if (!matrixResult.success || !matrixResult.data) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Failed to load role permissions: {matrixResult.message}
      </div>
    );
  }

  const { permissions, rolePermissions } = matrixResult.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            href="/users-roles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Users & Roles
          </Link>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-purple-600/10 border border-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                <Shield size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Role Permission Management
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-13">
              Configure granular module-level permission keys assigned to each system role.
            </p>
          </div>
        </div>

        {/* Matrix Component */}
        <RolePermissionMatrix
          permissions={permissions}
          initialRolePermissions={rolePermissions}
          actorRole={actorRole}
        />
      </main>
    </div>
  );
}
