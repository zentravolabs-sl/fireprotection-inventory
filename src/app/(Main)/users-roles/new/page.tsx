// ============================================================
// src/app/(Main)/users-roles/new/page.tsx
// Create User form page.
// Route: /users-roles/new
// Access: SUPER_ADMIN, ADMIN
// ============================================================

import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireAnyRole } from "@/lib/auth/authorization";
import UserForm from "@/components/users/user-form";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add User â€” CDN Fire Engineering",
  description: "Create a new system user account.",
};

export default async function NewUserPage() {
  const actor = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

  return (
    <div className="min-h-screen bg-[#090e1a]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#5a657a] mb-6">
          <Link
            href="/users-roles"
            className="hover:text-[#dce3ef] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            User Management
          </Link>
          <span>/</span>
          <span className="text-[#dce3ef]">Add User</span>
        </div>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#e02424]/10 border border-[#e02424]/20 rounded-xl flex items-center justify-center">
            <UserPlus size={18} className="text-[#e02424]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#dce3ef]">Add User</h1>
            <p className="text-sm text-[#5a657a]">Create a new system user account.</p>
          </div>
        </div>

        {/* Form */}
        <UserForm mode="create" actorRole={actor.role as UserRole} />
      </main>
    </div>
  );
}
