"use client";

// ============================================================
// src/components/staff/StaffAttendanceModal.tsx
// Modal for adding or updating daily staff attendance.
// Status: PRESENT = 1.0 day, HALF_DAY = 0.5 day, ABSENT = 0, LEAVE = 0.
// Enforces unique (projectStaffId, workDate).
// ============================================================

import React, { useState, useEffect } from "react";
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
    "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialAttendance ? `Edit Attendance — ${staff.user.name}` : `Log Attendance — ${staff.user.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
        )}

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 text-xs">
          <p className="text-xs text-red-800 dark:text-red-300 font-medium">
            Staff: <strong>{staff.user.name}</strong> ({staff.role.replace("_", " ")})
          </p>
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
            PRESENT = 1.0 worked day · HALF DAY = 0.5 worked day · ABSENT/LEAVE = 0 days.
          </p>
        </div>

        <div>
          <label className={labelCls}>Work Date *</label>
          <DatePicker
            selected={parseStringToDate(workDate)}
            onChange={(date: Date | null) => setWorkDate(formatDateToString(date))}
            dateFormat="yyyy-MM-dd"
            disabled={Boolean(initialAttendance)}
            showPopperArrow={false}
            className={inputCls}
            wrapperClassName="w-full"
          />
        </div>

        <div>
          <label className={labelCls}>Attendance Status *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "PRESENT", label: "Present (1 Day)" },
              { id: "HALF_DAY", label: "Half Day (0.5 Day)" },
              { id: "ABSENT", label: "Absent (0 Day)" },
              { id: "LEAVE", label: "Leave (0 Day)" },
            ].map((st) => (
              <button
                type="button"
                key={st.id}
                onClick={() => handleStatusChange(st.id as any)}
                className={`px-3 py-2.5 text-xs rounded-xl border transition-all text-left font-semibold ${
                  status === st.id
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
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
            Save Attendance
          </button>
        </div>
      </form>
    </Modal>
  );
}
