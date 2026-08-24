"use client";

// ============================================================
// src/components/users/RolePermissionMatrix.tsx
// Interactive Role & Permission Management Matrix component.
// Grouped by Module with toggle capabilities and server action persistence.
// ============================================================

import React, { useState, useTransition } from "react";
import { updateRolePermissionsAction } from "@/app/actions/user-actions";
import { Check, Shield, Save, CheckSquare, Square, AlertCircle, Lock } from "lucide-react";
import type { UserRole } from "@/types/auth";

interface PermissionItem {
  id: number;
  key: string;
  name: string;
  module: string;
  description: string | null;
}

interface RolePermissionMatrixProps {
  permissions: PermissionItem[];
  initialRolePermissions: Record<string, number[]>;
  actorRole: UserRole;
}

const CONCONFIGURABLE_ROLES: { role: UserRole; label: string; badgeColor: string; locked?: boolean }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin", badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300", locked: true },
  { role: "ADMIN", label: "Admin", badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  { role: "CEO", label: "CEO", badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
  { role: "GENERAL_MANAGER", label: "General Manager", badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  { role: "PROJECT_MANAGER", label: "Project Manager", badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  { role: "QS_ENGINEER", label: "QS Engineer", badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  { role: "PURCHASE_ENGINEER", label: "Purchase Engineer", badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  { role: "INVENTORY_CONTROLLER", label: "Inventory Controller", badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  { role: "ENGINEER", label: "Site Engineer", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  { role: "ACCOUNTANT", label: "Accountant", badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  { role: "USER", label: "Standard User", badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
];

export function RolePermissionMatrix({
  permissions,
  initialRolePermissions,
  actorRole,
}: RolePermissionMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("SUPER_ADMIN");
  const [rolePermState, setRolePermState] = useState<Record<string, number[]>>(initialRolePermissions);
  const [isPending, startTransition] = useTransition();
  const isSelectedRoleLocked = CONCONFIGURABLE_ROLES.find((r) => r.role === selectedRole)?.locked ?? false;
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  const currentRolePermIds = new Set(rolePermState[selectedRole] || []);

  const handleToggle = (permissionId: number) => {
    setRolePermState((prev) => {
      const currentList = prev[selectedRole] || [];
      const updated = currentList.includes(permissionId)
        ? currentList.filter((id) => id !== permissionId)
        : [...currentList, permissionId];

      return {
        ...prev,
        [selectedRole]: updated,
      };
    });
  };

  const handleToggleModule = (moduleName: string) => {
    const modulePermIds = permissions.filter((p) => p.module === moduleName).map((p) => p.id);
    const allSelected = modulePermIds.every((id) => currentRolePermIds.has(id));

    setRolePermState((prev) => {
      const currentList = prev[selectedRole] || [];
      const updated = allSelected
        ? currentList.filter((id) => !modulePermIds.includes(id))
        : Array.from(new Set([...currentList, ...modulePermIds]));

      return {
        ...prev,
        [selectedRole]: updated,
      };
    });
  };

  const handleSave = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const targetIds = rolePermState[selectedRole] || [];
      const res = await updateRolePermissionsAction(selectedRole, targetIds);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message });
      } else {
        setStatusMessage({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Role Selection Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 shadow-sm">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2 px-1">
          Select Role to Configure Permissions
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CONCONFIGURABLE_ROLES.map(({ role, label, badgeColor, locked }) => {
            const isSelected = selectedRole === role;
            const permCount = (rolePermState[role] || []).length;

            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? locked
                      ? "bg-rose-700 text-white border-rose-700 shadow-sm"
                      : "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                }`}
              >
                {locked && <Lock size={11} />}
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : badgeColor
                  }`}
                >
                  {permCount} perms
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Header Strip */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 shadow-sm flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {isSelectedRoleLocked ? <Lock className="text-rose-600" size={18} /> : <Shield className="text-red-600" size={18} />}
            <span>Configuring Permissions for <strong>{selectedRole}</strong></span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Total Granted: {currentRolePermIds.size} of {permissions.length} system permissions
            {isSelectedRoleLocked && (
              <span className="ml-2 inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                <Lock size={10} /> System-locked — cannot be modified
              </span>
            )}
          </p>
        </div>

        {!isSelectedRoleLocked && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save size={15} />
            {isPending ? "Saving..." : "Save Role Permissions"}
          </button>
        )}
      </div>

      {/* Super Admin Lock Notice */}
      {isSelectedRoleLocked && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
          <Lock size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold">Super Admin — System Locked</p>
            <p className="text-[11px] mt-0.5 text-rose-700 dark:text-rose-400">
              Super Admin automatically inherits <strong>all {permissions.length} system permissions</strong> dynamically at runtime.
              These permissions cannot be modified through the UI — SUPER_ADMIN always has full access to every module.
            </p>
          </div>
        </div>
      )}

      {/* Notification Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Module Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((moduleName) => {
          const modulePerms = permissions.filter((p) => p.module === moduleName);
          const allSelected = modulePerms.every((p) => currentRolePermIds.has(p.id));
          const someSelected = modulePerms.some((p) => currentRolePermIds.has(p.id));

          return (
            <div
              key={moduleName}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Module Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{moduleName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({modulePerms.length})</span>
                  </h3>

                  {!isSelectedRoleLocked && (
                    <button
                      type="button"
                      onClick={() => handleToggleModule(moduleName)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      {allSelected ? (
                        <>
                          <CheckSquare size={13} /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square size={13} /> Select All
                        </>
                      )}
                    </button>
                  )}
                  {isSelectedRoleLocked && (
                    <Lock size={12} className="text-rose-400" />
                  )}
                </div>

                {/* Permission Checkboxes */}
                <div className="space-y-2">
                  {modulePerms.map((perm) => {
                    const isChecked = currentRolePermIds.has(perm.id);

                    return (
                      <label
                        key={perm.id}
                        onClick={() => !isSelectedRoleLocked && handleToggle(perm.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                          isSelectedRoleLocked
                            ? "cursor-default opacity-80"
                            : "cursor-pointer"
                        } ${
                          isChecked
                            ? isSelectedRoleLocked
                              ? "bg-rose-50/60 dark:bg-rose-950/20 text-gray-900 dark:text-gray-100"
                              : "bg-red-50/60 dark:bg-red-950/30 text-gray-900 dark:text-gray-100"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          disabled={isSelectedRoleLocked}
                          className={`mt-0.5 rounded focus:ring-red-500 ${
                            isSelectedRoleLocked
                              ? "accent-rose-400 cursor-default"
                              : "text-red-600 accent-red-600"
                          }`}
                        />
                        <div className="text-xs leading-tight">
                          <div className="font-bold text-gray-900 dark:text-gray-100">{perm.name}</div>
                          <div className="text-[11px] font-mono text-gray-400">{perm.key}</div>
                          {perm.description && (
                            <div className="text-[10px] text-gray-400 mt-0.5">{perm.description}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
