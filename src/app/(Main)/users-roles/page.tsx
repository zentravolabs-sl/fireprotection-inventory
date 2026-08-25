// ============================================================
// src/app/(Main)/users-roles/page.tsx
// User Management â€” list page.
// Route: /users-roles
// Access: SUPER_ADMIN, ADMIN
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/authorization";
import { queryUsers } from "@/lib/data/users";
import UserTable from "@/components/users/user-table";
import UserTableSkeleton from "@/components/users/UserTableSkeleton";
import UserFilters from "@/components/users/user-filters";
import { UserPlus, Users } from "lucide-react";
import type { UserRole, UserProfile } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management â€” CDN Fire Engineering",
  description: "Manage system users, access roles and account status.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    isActive?: string;
    page?: string;
  }>;
}

export default async function UsersRolesPage({ searchParams }: PageProps) {
  const actor = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  let users: UserProfile[] = [];
  let total = 0;
  let totalPages = 1;
  let currentPage = 1;
  let limit = 5;
  let fetchError: string | null = null;

  try {
    const result = await queryUsers({
      search: params.search,
      role: (params.role ?? "") as UserRole | "",
      isActive: (params.isActive ?? "") as "true" | "false" | "",
      page,
      limit: 5,
    });
    users = result.users;
    total = result.total;
    totalPages = result.totalPages;
    currentPage = result.page;
    limit = result.limit;
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : "Failed to load users";
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center shrink-0">
                <Users size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                User Management
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-13">
              Manage system users, access roles and account status.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/users-roles/permissions"
              id="manage-permissions-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all flex-shrink-0"
            >
              <Users size={15} className="text-purple-600" />
              Role Permissions
            </Link>

            <Link
              href="/users-roles/new"
              id="add-user-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all flex-shrink-0"
            >
              <UserPlus size={15} />
              Add User
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Users", value: total },
            { label: "Active", value: users.filter((u) => u.isActive).length },
            { label: "Inactive", value: users.filter((u) => !u.isActive).length },
            { label: "Admins", value: users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "ADMIN").length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-sm"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5">
          <Suspense fallback={null}>
            <UserFilters />
          </Suspense>
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-5 py-4 text-sm text-rose-400 mb-5">
            Failed to load users: {fetchError}
          </div>
        )}

        {/* Table */}
        <Suspense fallback={<UserTableSkeleton />}>
          <UserTable
            users={users}
            actorRole={actor.role}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
    </div>
  );
}
