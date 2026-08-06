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
import UserAvatar from "@/components/users/user-avatar";
import UserRoleBadge from "@/components/users/user-role-badge";
import UserStatusBadge from "@/components/users/user-status-badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { activateUser, deactivateUser, changeUserRole } from "@/app/actions/user-actions";
import type { UserProfile, UserRole } from "@/types/auth";

// ── Types ───────────────────────────────────────────────────

interface UserTableProps {
  users: UserProfile[];
  actorRole: UserRole;
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
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "ENGINEER", label: "Engineer" },
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
              href={`/dashboard/users-roles/${user.id}`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#dce3ef] hover:bg-[#1e2a3d] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye size={14} className="text-[#5a657a]" />
              View Details
            </Link>

            <Link
              href={`/dashboard/users-roles/${user.id}/edit`}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-[#0F1524] border border-[#1e2a3d] rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-[#1e2a3d]">
          <h2 id="change-role-title" className="text-base font-bold text-[#dce3ef]">Change Role</h2>
          <p className="text-sm text-[#5a657a] mt-0.5">{user.name}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#5a657a]">Select Role</label>
            <div className="relative">
              <select
                id="change-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full h-10 pl-3 pr-8 bg-[#161d2e] border border-[#1e2a3d] rounded-xl text-sm text-[#dce3ef] focus:outline-none focus:border-[#e02424]/60 appearance-none cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value} disabled={!canAssignRole(r.value)}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a657a] pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#1e2a3d] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-[#5a657a] hover:text-[#dce3ef] border border-[#1e2a3d] rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || selectedRole === user.role}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#c51c1c] rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table Component ────────────────────────────────────

export default function UserTable({ users, actorRole }: UserTableProps) {
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
      <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-16 text-center">
        <div className="w-16 h-16 bg-[#161d2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#5a657a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-[#dce3ef] font-semibold">No users found</p>
        <p className="text-[#5a657a] text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#1e2a3d]">
                {["User", "Emp. Code", "Email", "Phone", "Role", "Status", "Last Updated", ""].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-[#5a657a] uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#161d2e] transition-colors group"
                >
                  {/* User column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} image={user.image} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#dce3ef] truncate">{user.name}</p>
                        {user.designation && (
                          <p className="text-xs text-[#5a657a] truncate">{user.designation}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Employee code */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono text-[#5a657a]">
                      {user.employeeCode ?? <span className="text-[#2a3a52]">—</span>}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-[#dce3ef]/80 truncate max-w-[180px] block">{user.email}</span>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-[#5a657a]">
                      {user.phone ?? <span className="text-[#2a3a52]">—</span>}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <UserRoleBadge role={user.role} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <UserStatusBadge isActive={user.isActive} size="sm" />
                  </td>

                  {/* Last Updated */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-[#5a657a] whitespace-nowrap">
                      {new Date(user.updatedAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
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
            className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} image={user.image} size="md" />
                <div>
                  <p className="font-semibold text-[#dce3ef] text-sm">{user.name}</p>
                  {user.designation && (
                    <p className="text-xs text-[#5a657a]">{user.designation}</p>
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
            <p className="text-xs text-[#5a657a] mt-2">{user.email}</p>
          </div>
        ))}
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
