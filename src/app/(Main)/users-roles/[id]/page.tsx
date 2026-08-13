// ============================================================
// src/app/(Main)/dashboard/users-roles/[id]/page.tsx
// User Detail view page.
// Route: /dashboard/users-roles/[id]
// Access: SUPER_ADMIN, ADMIN
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Briefcase,
  Building,
  IdCard,
  CalendarDays,
  Clock,
  ShieldCheck,
  Package,
  BarChart3,
  ClipboardList,
  FolderOpen,
} from "lucide-react";
import { requireAnyRole } from "@/lib/auth/authorization";
import { queryUserById } from "@/lib/data/users";
import UserAvatar from "@/components/users/user-avatar";
import UserRoleBadge from "@/components/users/user-role-badge";
import UserStatusBadge from "@/components/users/user-status-badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Details — CDN Fire Engineering",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1e2a3d] last:border-0">
      <span className="mt-0.5 text-[#5a657a] flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#5a657a] uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm text-[#dce3ef]">{value}</div>
      </div>
    </div>
  );
}

function PlaceholderSection({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#1e2a3d]">
        <span className="text-[#5a657a]">{icon}</span>
        <h2 className="text-sm font-bold text-[#dce3ef]">{title}</h2>
        <span className="ml-auto text-xs px-2 py-0.5 bg-[#161d2e] text-[#5a657a] border border-[#1e2a3d] rounded-full">
          Coming soon
        </span>
      </div>
      <div className="text-center py-6">
        <div className="w-10 h-10 bg-[#161d2e] rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-[#2a3a52]">{icon}</span>
        </div>
        <p className="text-sm text-[#5a657a]">{description}</p>
      </div>
    </div>
  );
}

export default async function UserDetailPage({ params }: PageProps) {
  await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

  const { id } = await params;
  const user = await queryUserById(id);

  if (!user) {
    notFound();
  }

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-[#080c12]">
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <span className="text-[#dce3ef] truncate max-w-[200px]">{user.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Profile card */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile card */}
            <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <UserAvatar name={user.name} image={user.image} size="lg" />
                <h1 className="text-lg font-black text-[#dce3ef] mt-4">{user.name}</h1>
                {user.designation && (
                  <p className="text-sm text-[#5a657a] mt-0.5">{user.designation}</p>
                )}
                {user.department && (
                  <p className="text-xs text-[#2a3a52] mt-0.5">{user.department}</p>
                )}
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                  <UserRoleBadge role={user.role} />
                  <UserStatusBadge isActive={user.isActive} />
                </div>
              </div>

              <Link
                href={`/users-roles/${user.id}/edit`}
                id={`edit-user-${user.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#dce3ef] bg-[#161d2e] hover:bg-[#1e2a3d] border border-[#1e2a3d] rounded-xl transition-colors"
              >
                <Pencil size={14} />
                Edit User
              </Link>
            </div>

            {/* Quick stats */}
            <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-[#dce3ef] mb-4 pb-3 border-b border-[#1e2a3d]">Account Info</h2>
              <div className="space-y-0">
                <DetailRow
                  icon={<ShieldCheck size={14} />}
                  label="Email Verified"
                  value={
                    user.emailVerified ? (
                      <span className="text-emerald-400">Verified</span>
                    ) : (
                      <span className="text-amber-400">Not Verified</span>
                    )
                  }
                />
                <DetailRow
                  icon={<CalendarDays size={14} />}
                  label="Member Since"
                  value={formatDate(user.createdAt)}
                />
                <DetailRow
                  icon={<Clock size={14} />}
                  label="Last Updated"
                  value={formatDate(user.updatedAt)}
                />
              </div>
            </div>
          </div>

          {/* Right column: Details + future sections */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact & profile details */}
            <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
              <h2 className="text-sm font-bold text-[#dce3ef] mb-4 pb-3 border-b border-[#1e2a3d]">
                Profile Details
              </h2>
              <DetailRow
                icon={<Mail size={14} />}
                label="Email Address"
                value={user.email}
              />
              <DetailRow
                icon={<Phone size={14} />}
                label="Phone"
                value={user.phone ?? <span className="text-[#2a3a52]">Not set</span>}
              />
              <DetailRow
                icon={<IdCard size={14} />}
                label="Employee Code"
                value={
                  user.employeeCode ? (
                    <span className="font-mono">{user.employeeCode}</span>
                  ) : (
                    <span className="text-[#2a3a52]">Not assigned</span>
                  )
                }
              />
              <DetailRow
                icon={<Briefcase size={14} />}
                label="Designation"
                value={user.designation ?? <span className="text-[#2a3a52]">Not set</span>}
              />
              <DetailRow
                icon={<Building size={14} />}
                label="Department"
                value={user.department ?? <span className="text-[#2a3a52]">Not set</span>}
              />
            </div>

            {/* Future: Assigned Projects */}
            <PlaceholderSection
              icon={<FolderOpen size={16} />}
              title="Assigned Projects"
              description="Project assignments will be shown here once the Projects module is implemented."
            />

            {/* Future: Stock Activity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <PlaceholderSection
                icon={<Package size={16} />}
                title="Stock Receive Activity"
                description="Goods received by this user will appear here."
              />
              <PlaceholderSection
                icon={<BarChart3 size={16} />}
                title="Stock Movement Activity"
                description="Stock movements created by this user will appear here."
              />
            </div>

            {/* Future: Audit Activity */}
            <PlaceholderSection
              icon={<ClipboardList size={16} />}
              title="Audit Activity"
              description="System audit events for this user will be shown here."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
