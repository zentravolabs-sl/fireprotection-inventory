"use client";

// ============================================================
// src/components/users/user-table.tsx
// Responsive data table for the User Management list.
// Actions: View, Edit, Change Role, Activate/Deactivate.
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  MoreVertical,
  Eye,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import UserAvatar from "@/components/users/user-avatar";
import UserRoleBadge from "@/components/users/user-role-badge";
import UserStatusBadge from "@/components/users/user-status-badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { activateUser, deactivateUser, changeUserRole } from "@/app/actions/user-actions";
import type { UserProfile, UserRole } from "@/types/auth";

// ── Types ───────────────────────────────────────────────────

interface UserTableProps {
  users: UserProfile[];
  actorRole: UserRole;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

interface ActionMenuProps {
  user: UserProfile;
  actorRole: UserRole;
  onStatusToggle: (user: UserProfile, action: "activate" | "deactivate") => void;
  onRoleChange: (user: UserProfile) => void;
}

// ── Role options for change-role dropdown ───────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "USER", label: "User" },
];

// ── Action Menu ─────────────────────────────────────────────

function ActionMenu({ user, actorRole, onStatusToggle, onRoleChange }: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id={`user-action-menu-${user.id}`}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded-lg text-[#5a657a] hover:text-[#dce3ef] hover:bg-[#1e2a3d] transition-colors"
        aria-label={`Actions for ${user.name}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 bg-[#161d2e] border border-[#1e2a3d] rounded-xl shadow-2xl overflow-hidden">
          <div className="py-1">
            <Link
              href={`/users-roles/${user.id}`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dce3ef] hover:bg-[#1e2a3d] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye size={14} className="text-[#5a657a]" />
              View Details
            </Link>

            <Link
              href={`/users-roles/${user.id}/edit`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dce3ef] hover:bg-[#1e2a3d] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil size={14} className="text-[#5a657a]" />
              Edit User
            </Link>

            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dce3ef] hover:bg-[#1e2a3d] transition-colors"
              onClick={() => {
                setOpen(false);
                onRoleChange(user);
              }}
            >
              <ShieldCheck size={14} className="text-[#5a657a]" />
              Change Role
            </button>

            <div className="my-1 border-t border-[#1e2a3d]" />

            {user.isActive ? (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                onClick={() => {
                  setOpen(false);
                  onStatusToggle(user, "deactivate");
                }}
              >
                <UserX size={14} />
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                onClick={() => {
                  setOpen(false);
                  onStatusToggle(user, "activate");
                }}
              >
                <UserCheck size={14} />
                Activate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Change Role Modal ───────────────────────────────────────

interface ChangeRoleModalProps {
  user: UserProfile | null;
  actorRole: UserRole;
  onClose: () => void;
}

function ChangeRoleModal({ user, actorRole, onClose }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? "USER");
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const canAssignRole = (role: UserRole) => {
    // SUPER_ADMIN can assign any role; ADMIN cannot assign SUPER_ADMIN
    if (actorRole === "SUPER_ADMIN") return true;
    if (actorRole === "ADMIN") return role !== "SUPER_ADMIN";
    return false;
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", user.id);
      fd.set("newRole", selectedRole);
      const result = await changeUserRole(undefined as never, fd);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="change-role-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-gray-900 dark:text-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 id="change-role-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">Change Role</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.name}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Role</label>
            <Select
              instanceId="change-role-select"
              options={ROLE_OPTIONS.filter((r) => canAssignRole(r.value))}
              value={ROLE_OPTIONS.find((r) => r.value === selectedRole) || null}
              onChange={(val) => val && setSelectedRole(val.value as UserRole)}
              isSearchable
              menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
              styles={getCustomSelectStyles()}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || selectedRole === user.role}
            className="inline-flex items-center gap-2 py-3 px-5 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-60"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table Component ────────────────────────────────────

export default function UserTable({
  users,
  actorRole,
  total = 0,
  page = 1,
  limit = 5,
  totalPages = 1,
}: UserTableProps) {
  const [statusTarget, setStatusTarget] = useState<{
    user: UserProfile;
    action: "activate" | "deactivate";
  } | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserProfile | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    const action = statusTarget.action === "activate" ? activateUser : deactivateUser;
    const result = await action(statusTarget.user.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setStatusTarget(null);
  };

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-semibold">No users found</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                {["User", "Emp. Code", "Email", "Phone", "Role", "Status", "Last Updated", ""].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  {/* User column */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} image={user.image} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                        {user.designation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.designation}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Employee code */}
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {user.employeeCode ?? <span className="text-gray-400 font-normal">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[180px] block">{user.email}</span>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">
                    {user.phone ?? <span className="text-gray-400">—</span>}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <UserRoleBadge role={user.role} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <UserStatusBadge isActive={user.isActive} size="sm" />
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(user.updatedAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <ActionMenu
                      user={user}
                      actorRole={actorRole}
                      onStatusToggle={(u, action) => setStatusTarget({ user: u, action })}
                      onRoleChange={(u) => setRoleTarget(u)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} image={user.image} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user.name}</p>
                  {user.designation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.designation}</p>
                  )}
                </div>
              </div>
              <ActionMenu
                user={user}
                actorRole={actorRole}
                onStatusToggle={(u, action) => setStatusTarget({ user: u, action })}
                onRoleChange={(u) => setRoleTarget(u)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <UserRoleBadge role={user.role} size="sm" />
              <UserStatusBadge isActive={user.isActive} size="sm" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{user.email}</p>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={total}
          limit={limit}
        />
      </div>

      {/* Confirm deactivate/activate dialog */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
        title={statusTarget?.action === "deactivate" ? "Deactivate User" : "Activate User"}
        description={
          statusTarget?.action === "deactivate"
            ? `Are you sure you want to deactivate ${statusTarget?.user.name}? They will lose access to the system immediately.`
            : `Are you sure you want to activate ${statusTarget?.user.name}? They will regain access to the system.`
        }
        confirmText={statusTarget?.action === "deactivate" ? "Deactivate" : "Activate"}
        variant={statusTarget?.action === "deactivate" ? "danger" : "info"}
      />

      {/* Change role modal */}
      {roleTarget && (
        <ChangeRoleModal
          user={roleTarget}
          actorRole={actorRole}
          onClose={() => setRoleTarget(null)}
        />
      )}
    </>
  );
}
