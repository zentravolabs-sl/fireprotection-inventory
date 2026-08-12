"use client";

// ============================================================
// src/components/staff/SetStaffCostModal.tsx
// Modal for Admin/PM to manually edit SalaryCost, OTHours, and OTCost for project staff.
// ============================================================

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id: number;
    salaryCost: number;
    otHours: number;
    otCost: number;
    remarks?: string | null;
  }) => Promise<void>;
  staff: {
    id: number;
    salaryCost: number;
    otHours: number;
    otCost: number;
    remarks?: string | null;
    user: { name: string };
    role: string;
  } | null;
  isSubmitting: boolean;
}

export function SetStaffCostModal({ isOpen, onClose, onSubmit, staff, isSubmitting }: Props) {
  const [salaryCost, setSalaryCost] = useState<number>(staff?.salaryCost ?? 0);
  const [otHours, setOtHours] = useState<number>(staff?.otHours ?? 0);
  const [otCost, setOtCost] = useState<number>(staff?.otCost ?? 0);
  const [remarks, setRemarks] = useState<string>(staff?.remarks ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (staff) {
      setSalaryCost(staff.salaryCost ?? 0);
      setOtHours(staff.otHours ?? 0);
      setOtCost(staff.otCost ?? 0);
      setRemarks(staff.remarks ?? "");
    }
  }, [staff]);

  const totalCost = salaryCost + otCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!staff) return;
    if (salaryCost < 0) {
      setError("Salary cost cannot be negative.");
      return;
    }
    if (otHours < 0 || otCost < 0) {
      setError("OT hours and OT cost cannot be negative.");
      return;
    }
    await onSubmit({
      id: staff.id,
      salaryCost,
      otHours,
      otCost,
      remarks: remarks.trim() || null,
    });
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!staff) return null;

  const inputCls =
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Set Staff Costs — ${staff.user.name}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
        )}

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
          <p className="text-xs text-red-800 dark:text-red-300 font-medium">
            Staff Member: <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")})
          </p>
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
            Set the project-specific salary cost allocation and overtime cost.
          </p>
        </div>

        <div>
          <label className={labelCls}>Allocated Salary Cost (LKR) *</label>
          <input
            type="number"
            value={salaryCost}
            onChange={(e) => setSalaryCost(Number(e.target.value))}
            min={0}
            step={0.01}
            placeholder="0.00"
            className={inputCls}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>OT Hours</label>
            <input
              type="number"
              value={otHours}
              onChange={(e) => setOtHours(Number(e.target.value))}
              min={0}
              step={0.5}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>OT Cost (LKR)</label>
            <input
              type="number"
              value={otCost}
              onChange={(e) => setOtCost(Number(e.target.value))}
              min={0}
              step={0.01}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
        </div>

        <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Staff Cost (Salary + OT)</span>
            <span className="text-sm font-black text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(totalCost)}
            </span>
          </div>
        </div>

        <div>
          <label className={labelCls}>Remarks / Financial Notes</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional financial or allocation notes"
            className={`${inputCls} resize-none`}
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
            className="w-40 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
          >
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Save Staff Costs
          </button>
        </div>
      </form>
    </Modal>
  );
}
