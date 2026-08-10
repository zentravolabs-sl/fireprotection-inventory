"use client";

// ============================================================
// src/components/labour/LogOTModal.tsx
// Modal for logging overtime for a project labour assignment.
// ============================================================

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";

interface AssignmentOption {
  id: number;
  labour: { name: string; labourCode: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    projectLabourId: number;
    otDate: string;
    otHours: number;
    otRatePerHour: number;
    remarks: string | null;
  }) => Promise<void>;
  assignments: AssignmentOption[];
  isSubmitting: boolean;
  preselectedId?: number;
}

export function LogOTModal({ isOpen, onClose, onSubmit, assignments, isSubmitting, preselectedId }: Props) {
  const [projectLabourId, setProjectLabourId] = useState<number>(preselectedId ?? 0);
  const [otDate, setOtDate] = useState(new Date().toISOString().split("T")[0]);
  const [otHours, setOtHours] = useState<number>(0);
  const [otRatePerHour, setOtRatePerHour] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const otAmount = parseFloat((otHours * otRatePerHour).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!projectLabourId) { setError("Select an assigned labour."); return; }
    if (!otDate) { setError("OT date is required."); return; }
    if (otHours <= 0) { setError("OT hours must be greater than 0."); return; }
    if (otRatePerHour <= 0) { setError("OT rate must be greater than 0."); return; }
    await onSubmit({ projectLabourId, otDate, otHours, otRatePerHour, remarks: remarks.trim() || null });
  };

  const handleClose = () => {
    setProjectLabourId(preselectedId ?? 0);
    setOtDate(new Date().toISOString().split("T")[0]);
    setOtHours(0);
    setOtRatePerHour(0);
    setRemarks("");
    setError("");
    onClose();
  };

  const inputCls =
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log Overtime (OT)" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div>
          <label className={labelCls}>Labour <span className="text-red-500">*</span></label>
          <select value={projectLabourId} onChange={(e) => setProjectLabourId(Number(e.target.value))} className={inputCls}>
            <option value={0}>— Select assigned labour —</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.labour.labourCode} — {a.labour.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>OT Date <span className="text-red-500">*</span></label>
          <input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>OT Hours <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={otHours || ""}
              onChange={(e) => setOtHours(Number(e.target.value))}
              min={0}
              step={0.5}
              placeholder="e.g. 2.5"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rate / Hour (LKR) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={otRatePerHour || ""}
              onChange={(e) => setOtRatePerHour(Number(e.target.value))}
              min={0}
              step={0.01}
              placeholder="e.g. 250.00"
              className={inputCls}
            />
          </div>
        </div>

        {/* Computed OT Amount */}
        <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Computed OT Amount</span>
            <span className="text-sm font-black text-orange-800 dark:text-orange-300">
              {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(otAmount)}
            </span>
          </div>
          {otHours > 0 && otRatePerHour > 0 && (
            <p className="text-[11px] text-orange-600 dark:text-orange-500 mt-0.5">
              {otHours} h × {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(otRatePerHour)}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional notes about this OT"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={handleClose} disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm">
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Log OT
          </button>
        </div>
      </form>
    </Modal>
  );
}
