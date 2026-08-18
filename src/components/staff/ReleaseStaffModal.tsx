"use client";

// ============================================================
// src/components/staff/ReleaseStaffModal.tsx
// Modal to release a staff member from a project with release date selection.
// ============================================================

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "@/components/ui/Modal";

const formatDateToString = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseStringToDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

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
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Release Staff Member from Project" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
        )}

        <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300">
          <p className="font-bold mb-1 text-sm">Release Confirmation</p>
          <p className="leading-relaxed">
            Are you sure you want to release <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")}) from this project?
            They will be marked as RELEASED and moved to Staff History. Historical records will never be deleted.
          </p>
        </div>

        <div className="pb-36">
          <label className={labelCls}>Released Date *</label>
          <DatePicker
            selected={parseStringToDate(releasedDate)}
            onChange={(date: Date | null) => setReleasedDate(formatDateToString(date))}
            dateFormat="yyyy-MM-dd"
            showPopperArrow={false}
            className={inputCls}
            wrapperClassName="w-full"
            popperClassName="z-[9999]"
            popperPlacement="bottom-start"
            popperProps={{
              strategy: "fixed",
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-44 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
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
