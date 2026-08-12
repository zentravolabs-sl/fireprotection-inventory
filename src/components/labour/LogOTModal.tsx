"use client";

// ============================================================
// src/components/labour/LogOTModal.tsx
// Modal for logging overtime for a project labour assignment.
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
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
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log Overtime (OT)" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
        )}

        <div>
          <label className={labelCls}>Labour *</label>
          <Select
            instanceId="log-ot-labour-select"
            options={assignments.map((a) => ({ value: a.id, label: `${a.labour.labourCode} — ${a.labour.name}` }))}
            value={assignments.filter((a) => a.id === projectLabourId).map((a) => ({ value: a.id, label: `${a.labour.labourCode} — ${a.labour.name}` }))[0] || null}
            onChange={(val) => setProjectLabourId(val ? val.value : 0)}
            placeholder="— Select assigned labour —"
            isSearchable
            isClearable
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
        </div>

        <div>
          <label className={labelCls}>OT Date *</label>
          <input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>OT Hours *</label>
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
            <label className={labelCls}>Rate / Hour (LKR) *</label>
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
        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">Computed OT Amount</span>
            <span className="text-sm font-black text-red-800 dark:text-red-200">
              {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(otAmount)}
            </span>
          </div>
          {otHours > 0 && otRatePerHour > 0 && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button type="button" onClick={handleClose} disabled={isSubmitting}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="w-40 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60">
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
