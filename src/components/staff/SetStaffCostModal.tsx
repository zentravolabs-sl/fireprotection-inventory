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
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Set Staff Costs — ${staff.user.name}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
            Staff Member: <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")})
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
            Set the project-specific salary cost allocation and overtime cost.
          </p>
        </div>

        <div>
          <label className={labelCls}>Allocated Salary Cost (LKR) <span className="text-red-500">*</span></label>
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

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
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
