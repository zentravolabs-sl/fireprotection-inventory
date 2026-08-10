"use client";

// ============================================================
// src/components/staff/AssignStaffModal.tsx
// Modal for assigning active company users (Engineers / PMs) to a project.
// ============================================================

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    userId: string;
    role: "PROJECT_MANAGER" | "ENGINEER";
    isLead?: boolean;
    assignedDate: string;
    remarks: string | null;
  }) => Promise<void>;
  users: UserOption[];
  isSubmitting: boolean;
}

export function AssignStaffModal({ isOpen, onClose, onSubmit, users, isSubmitting }: Props) {
  const [userId, setUserId] = useState<string>("");
  const [role, setRole] = useState<"PROJECT_MANAGER" | "ENGINEER">("ENGINEER");
  const [isLead, setIsLead] = useState<boolean>(false);
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const selectableUsers = users.filter((u) => {
    if (!u.isActive) return false;
    if (role === "PROJECT_MANAGER") {
      return u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN";
    }
    return u.role === "ENGINEER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN";
  });

  const handleRoleChange = (newRole: "PROJECT_MANAGER" | "ENGINEER") => {
    setRole(newRole);
    setUserId("");
    if (newRole === "PROJECT_MANAGER") {
      setIsLead(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId) {
      setError("Please select a staff member.");
      return;
    }
    if (!assignedDate) {
      setError("Assigned date is required.");
      return;
    }
    await onSubmit({
      userId,
      role,
      isLead: role === "ENGINEER" ? isLead : false,
      assignedDate,
      remarks: remarks.trim() || null,
    });
  };

  const handleClose = () => {
    setUserId("");
    setRole("ENGINEER");
    setIsLead(false);
    setAssignedDate(new Date().toISOString().split("T")[0]);
    setRemarks("");
    setError("");
    onClose();
  };

  const inputCls =
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Staff Member to Project" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div>
          <label className={labelCls}>Project Role <span className="text-red-500">*</span></label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as "PROJECT_MANAGER" | "ENGINEER")}
            className={inputCls}
          >
            <option value="ENGINEER">Engineer</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            This represents the staff member&apos;s assigned role specifically for this project.
          </p>
        </div>

        <div>
          <label className={labelCls}>Select Employee <span className="text-red-500">*</span></label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
            <option value="">— Select an active employee —</option>
            {selectableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.replace("_", " ")}) — {u.email}
              </option>
            ))}
          </select>
          {selectableUsers.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              No active users matching the selected role ({role.replace("_", " ")}) found.
            </p>
          )}
        </div>

        {role === "ENGINEER" && (
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-900/50">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-amber-900 dark:text-amber-300">
              <input
                type="checkbox"
                checked={isLead}
                onChange={(e) => setIsLead(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
              />
              <span>Designate as Lead Engineer for this project</span>
            </label>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 ml-6">
              Only one active engineer can be Lead Engineer. Setting this will update any existing lead designation.
            </p>
          </div>
        )}

        <div>
          <label className={labelCls}>Assigned Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Remarks / Assignment Notes</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional assignment scope or notes"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Assign Staff
          </button>
        </div>
      </form>
    </Modal>
  );
}
