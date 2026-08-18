"use client";

// ============================================================
// src/components/labour/AssignLabourModal.tsx
// Modal for Site Engineer / PM / Admin to assign a worker to a project.
// (Pure assignment — Labour Cost is set separately by Admin).
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getCustomSelectStyles } from "@/lib/selectStyles";
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

interface LabourOption {
  id: number;
  labourCode: string;
  name: string;
  labourType: { name: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    labourId: number;
    labourCost: number;
    startDate: string | null;
    endDate: string | null;
    remarks: string | null;
  }) => Promise<void>;
  availableLabours: LabourOption[];
  isSubmitting: boolean;
}

export function AssignLabourModal({ isOpen, onClose, onSubmit, availableLabours, isSubmitting }: Props) {
  const [labourId, setLabourId] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!labourId) { setError("Select a labour."); return; }
    await onSubmit({
      labourId,
      labourCost: 0, // Cost is set by Admin per assignment
      startDate: startDate || null,
      endDate: endDate || null,
      remarks: remarks.trim() || null,
    });
  };

  const handleClose = () => {
    setLabourId(0);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setRemarks("");
    setError("");
    onClose();
  };

  const inputCls =
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Worker to Project" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6 min-h-[460px] flex flex-col justify-between">
        <div className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
          )}

          <div>
            <label className={labelCls}>Select Worker *</label>
            <Select
              instanceId="assign-worker-select"
              options={availableLabours.map((l) => ({ value: l.id, label: `${l.labourCode} — ${l.name} (${l.labourType.name})` }))}
              value={availableLabours.filter((l) => l.id === labourId).map((l) => ({ value: l.id, label: `${l.labourCode} — ${l.name} (${l.labourType.name})` }))[0] || null}
              onChange={(val) => setLabourId(val ? val.value : 0)}
              placeholder="— Select a worker —"
              isSearchable
              isClearable
              menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
              styles={getCustomSelectStyles()}
            />
            {availableLabours.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                No unassigned workers available. Release a worker or register a new one.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Start Date *</label>
              <DatePicker
                selected={parseStringToDate(startDate)}
                onChange={(date: Date | null) => setStartDate(formatDateToString(date))}
                dateFormat="yyyy-MM-dd"
                showPopperArrow={false}
                className={inputCls}
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>Expected End Date</label>
              <DatePicker
                selected={parseStringToDate(endDate)}
                onChange={(date: Date | null) => setEndDate(formatDateToString(date))}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date..."
                isClearable
                showPopperArrow={false}
                className={inputCls}
                wrapperClassName="w-full"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks / Site Notes</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Optional site notes about this assignment..."
              className={`${inputCls} resize-none`}
            />
          </div>
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
            Assign Worker
          </button>
        </div>
      </form>
    </Modal>
  );
}
