// ============================================================
// src/app/(Main)/dashboard/users-roles/page.tsx
// User Management — list page.
// Route: /dashboard/users-roles
// Access: SUPER_ADMIN, ADMIN
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/authorization";
import { queryUsers } from "@/lib/data/users";
import UserTable from "@/components/users/user-table";
import UserFilters from "@/components/users/user-filters";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { UserPlus, Users } from "lucide-react";
import type { UserRole, UserProfile } from "@/types/auth";

export const metadata = {
  title: "User Management — CDN Fire Engineering",
  description: "Manage system users, access roles and account status.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    isActive?: string;
  }>;
}

export default async function UsersRolesPage({ searchParams }: PageProps) {
  const actor = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const params = await searchParams;

  let users: UserProfile[] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const result = await queryUsers({
      search: params.search,
      role: (params.role ?? "") as UserRole | "",
      isActive: (params.isActive ?? "") as "true" | "false" | "",
    });
    users = result.users;
    total = result.total;
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : "Failed to load users";
  }

  return (
    <div className="min-h-screen bg-[#080c12]">
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-[#e02424]/10 border border-[#e02424]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-[#e02424]" />
              </div>
              <h1 className="text-2xl font-black text-[#dce3ef] tracking-tight">
                User Management
              </h1>
            </div>
            <p className="text-sm text-[#5a657a] ml-[52px]">
              Manage system users, access roles and account status.
            </p>
          </div>

          <Link
            href="/dashboard/users-roles/new"
            id="add-user-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#c51c1c] rounded-xl shadow-sm transition-all hover:shadow-[0_0_0_3px_rgba(224,36,36,0.15)] flex-shrink-0"
          >
            <UserPlus size={15} />
            Add User
          </Link>
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
              className="bg-[#0F1524] border border-[#1e2a3d] rounded-xl px-4 py-3"
            >
              <p className="text-xs text-[#5a657a] font-medium">{stat.label}</p>
              <p className="text-xl font-black text-[#dce3ef] mt-0.5">{stat.value}</p>
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
        <Suspense fallback={<TableSkeleton rows={8} cols={8} />}>
          <UserTable users={users} actorRole={actor.role} />
        </Suspense>

        {/* Count footer */}
        {users.length > 0 && (
          <p className="text-xs text-[#5a657a] mt-4 text-right">
            Showing {users.length} of {total} user{total !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
