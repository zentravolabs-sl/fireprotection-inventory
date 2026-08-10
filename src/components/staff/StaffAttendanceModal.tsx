"use client";

// ============================================================
// src/components/staff/StaffAttendanceModal.tsx
// Modal for adding or updating daily staff attendance.
// Status: PRESENT = 1.0 day, HALF_DAY = 0.5 day, ABSENT = 0, LEAVE = 0.
// Enforces unique (projectStaffId, workDate).
// ============================================================

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    projectStaffId: number;
    workDate: string;
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
    workedHours: number;
    otHours: number;
    remarks?: string | null;
  }) => Promise<void>;
  staff: {
    id: number;
    user: { name: string };
    role: string;
    assignedDate: Date | string;
  } | null;
  isSubmitting: boolean;
  initialAttendance?: {
    id: number;
    workDate: Date | string;
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
    workedHours: number;
    otHours: number;
    remarks?: string | null;
  } | null;
}

export function StaffAttendanceModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  isSubmitting,
  initialAttendance,
}: Props) {
  const [workDate, setWorkDate] = useState(
    initialAttendance
      ? new Date(initialAttendance.workDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE">(
    initialAttendance?.status ?? "PRESENT"
  );
  const [workedHours, setWorkedHours] = useState<number>(initialAttendance?.workedHours ?? 8);
  const [otHours, setOtHours] = useState<number>(initialAttendance?.otHours ?? 0);
  const [remarks, setRemarks] = useState<string>(initialAttendance?.remarks ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAttendance) {
      setWorkDate(new Date(initialAttendance.workDate).toISOString().split("T")[0]);
      setStatus(initialAttendance.status);
      setWorkedHours(initialAttendance.workedHours);
      setOtHours(initialAttendance.otHours);
      setRemarks(initialAttendance.remarks ?? "");
    } else {
      setWorkDate(new Date().toISOString().split("T")[0]);
      setStatus("PRESENT");
      setWorkedHours(8);
      setOtHours(0);
      setRemarks("");
    }
  }, [initialAttendance, isOpen]);

  const handleStatusChange = (newStatus: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE") => {
    setStatus(newStatus);
    if (newStatus === "PRESENT") setWorkedHours(8);
    else if (newStatus === "HALF_DAY") setWorkedHours(4);
    else setWorkedHours(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!staff) return;
    if (!workDate) {
      setError("Work date is required.");
      return;
    }
    await onSubmit({
      projectStaffId: staff.id,
      workDate,
      status,
      workedHours,
      otHours,
      remarks: remarks.trim() || null,
    });
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!staff) return null;

  const inputCls =
    "w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialAttendance ? `Edit Attendance — ${staff.user.name}` : `Log Attendance — ${staff.user.name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
        )}

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            Staff: <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")})
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            PRESENT = 1.0 worked day · HALF DAY = 0.5 worked day · ABSENT/LEAVE = 0 days.
          </p>
        </div>

        <div>
          <label className={labelCls}>Work Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            disabled={Boolean(initialAttendance)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Attendance Status <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "PRESENT", label: "Present (1 Day)", cls: "hover:bg-emerald-50 hover:text-emerald-700 font-bold" },
              { id: "HALF_DAY", label: "Half Day (0.5 Day)", cls: "hover:bg-amber-50 hover:text-amber-700 font-bold" },
              { id: "ABSENT", label: "Absent (0 Day)", cls: "hover:bg-red-50 hover:text-red-700 font-bold" },
              { id: "LEAVE", label: "Leave (0 Day)", cls: "hover:bg-purple-50 hover:text-purple-700 font-bold" },
            ].map((st) => (
              <button
                type="button"
                key={st.id}
                onClick={() => handleStatusChange(st.id as any)}
                className={`px-3 py-2 text-xs rounded-lg border transition-all text-left font-semibold ${
                  status === st.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Worked Hours</label>
            <input
              type="number"
              value={workedHours}
              onChange={(e) => setWorkedHours(Number(e.target.value))}
              min={0}
              max={24}
              step={0.5}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>OT Hours</label>
            <input
              type="number"
              value={otHours}
              onChange={(e) => setOtHours(Number(e.target.value))}
              min={0}
              max={24}
              step={0.5}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Remarks / Notes</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional site attendance notes"
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Save Attendance
          </button>
        </div>
      </form>
    </Modal>
  );
}
