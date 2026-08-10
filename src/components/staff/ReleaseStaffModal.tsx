"use client";

// ============================================================
// src/components/staff/ReleaseStaffModal.tsx
// Modal to release a staff member from a project with release date selection.
// ============================================================

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (releasedDate: string) => Promise<void>;
  staff: {
    id: number;
    user: { name: string };
    role: string;
    assignedDate: Date | string;
  } | null;
  isSubmitting: boolean;
}

export function ReleaseStaffModal({ isOpen, onClose, onConfirm, staff, isSubmitting }: Props) {
  const [releasedDate, setReleasedDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!releasedDate) {
      setError("Released date is required.");
      return;
    }
    await onConfirm(releasedDate);
  };

  const handleClose = () => {
    setReleasedDate(new Date().toISOString().split("T")[0]);
    setError("");
    onClose();
  };

  if (!staff) return null;

  const inputCls =
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Release Staff Member from Project" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
          <p className="font-bold mb-0.5">Release Confirmation</p>
          <p>
            Are you sure you want to release <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")}) from this project?
            They will be marked as RELEASED and moved to Staff History. Historical records will never be deleted.
          </p>
        </div>

        <div>
          <label className={labelCls}>Released Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={releasedDate}
            onChange={(e) => setReleasedDate(e.target.value)}
            className={inputCls}
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Confirm Release
          </button>
        </div>
      </form>
    </Modal>
  );
}
