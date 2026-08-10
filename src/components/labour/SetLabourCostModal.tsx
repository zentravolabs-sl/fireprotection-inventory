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
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  if (!assignment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Set Labour Cost — ${assignment.labour.name}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
            Worker: <strong>{assignment.labour.name}</strong> ({assignment.labour.labourCode})
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
            Manually enter the agreed total labour cost for this project assignment.
          </p>
        </div>

        <div>
          <label className={labelCls}>Agreed Labour Cost (LKR) <span className="text-red-500">*</span></label>
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
            Save Labour Cost
          </button>
        </div>
      </form>
    </Modal>
  );
}
