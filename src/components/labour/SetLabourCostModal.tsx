"use client";

// ============================================================
// src/components/labour/SetLabourCostModal.tsx
// Modal for Admin/PM to manually set/edit Labour Cost for an assignment.
// ============================================================

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: number; labourCost: number; remarks?: string | null }) => Promise<void>;
  assignment: {
    id: number;
    labourCost: number;
    remarks?: string | null;
    labour: { name: string; labourCode: string };
  } | null;
  isSubmitting: boolean;
}

export function SetLabourCostModal({ isOpen, onClose, onSubmit, assignment, isSubmitting }: Props) {
  const [labourCost, setLabourCost] = useState<number>(assignment?.labourCost ?? 0);
  const [remarks, setRemarks] = useState<string>(assignment?.remarks ?? "");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (assignment) {
      setLabourCost(assignment.labourCost ?? 0);
      setRemarks(assignment.remarks ?? "");
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!assignment) return;
    if (labourCost < 0) {
      setError("Labour cost cannot be negative.");
      return;
    }
    await onSubmit({
      id: assignment.id,
      labourCost,
      remarks: remarks.trim() || null,
    });
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const inputCls =
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  if (!assignment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Set Labour Cost — ${assignment.labour.name}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
        )}

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
          <p className="text-xs text-red-800 dark:text-red-300 font-medium">
            Worker: <strong>{assignment.labour.name}</strong> ({assignment.labour.labourCode})
          </p>
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
            Manually enter the agreed total labour cost for this project assignment.
          </p>
        </div>

        <div>
          <label className={labelCls}>Agreed Labour Cost (LKR) *</label>
          <input
            type="number"
            value={labourCost}
            onChange={(e) => setLabourCost(Number(e.target.value))}
            min={0}
            step={0.01}
            placeholder="0.00"
            className={inputCls}
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls}>Remarks / Payment Notes</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional payment or agreement notes"
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
            Save Labour Cost
          </button>
        </div>
      </form>
    </Modal>
  );
}
