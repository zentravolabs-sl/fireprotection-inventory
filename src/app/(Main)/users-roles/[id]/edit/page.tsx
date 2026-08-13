// ============================================================
// src/app/(Main)/dashboard/users-roles/[id]/edit/page.tsx
// Edit User form page.
// Route: /dashboard/users-roles/[id]/edit
// Access: SUPER_ADMIN, ADMIN
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireAnyRole } from "@/lib/auth/authorization";
import { queryUserById } from "@/lib/data/users";
import { canManageRole } from "@/lib/auth/authorization";
import UserForm from "@/components/users/user-form";
import UserAvatar from "@/components/users/user-avatar";
import UserRoleBadge from "@/components/users/user-role-badge";
import type { UserRole } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit User — CDN Fire Engineering",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const actor = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const { id } = await params;
  const user = await queryUserById(id);

  if (!user) {
    notFound();
  }

  // Check if actor can manage this user's current role
  if (!canManageRole(actor.role as UserRole, user.role as UserRole)) {
    notFound(); // Present as 404 to avoid leaking info
  }

  return (
    <div className="min-h-screen bg-[#090e1a]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <Link
            href={`/users-roles/${user.id}`}
            className="hover:text-[#dce3ef] transition-colors truncate max-w-[150px]"
          >
            {user.name}
          </Link>
          <span>/</span>
          <span className="text-[#dce3ef]">Edit</span>
        </div>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8 bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-5">
          <UserAvatar name={user.name} image={user.image} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-[#dce3ef] truncate">{user.name}</h1>
              <Pencil size={14} className="text-[#5a657a]" />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <UserRoleBadge role={user.role} size="sm" />
              {user.designation && (
                <span className="text-xs text-[#5a657a]">{user.designation}</span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <UserForm
          mode="edit"
          defaultValues={user}
          actorRole={actor.role as UserRole}
        />
      </main>
    </div>
  );
}
