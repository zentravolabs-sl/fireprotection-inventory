"use client";

// ============================================================
// src/components/projects/AddExpenseModal.tsx
// Modal for recording Labour, Equipment, and Other Project Expenses
// Shows a custom UI Notice Modal when the entered amount pushes
// actual cost to/above the LKR 5,000,000 threshold.
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createExpenseAction } from "@/app/actions/expenses";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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

const EXPENSE_TYPE_OPTIONS = [
  { value: "LABOUR", label: "LABOUR (On-site sub-contractor / labour wages)" },
  { value: "EQUIPMENT", label: "EQUIPMENT (Scaffolding, Crane, Machinery hire)" },
  { value: "OTHER", label: "OTHER (Permits, testing fees, site utilities)" },
];

const COST_THRESHOLD = 5_000_000;

function formatLKR(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectCode: string;
  /** Current approved actual cost of the project (for threshold check). */
  currentActualCost?: number;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
  currentActualCost = 0,
}: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [expenseType, setExpenseType] = useState("LABOUR");
  const [amountInput, setAmountInput] = useState("");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const parsedAmount = parseFloat(amountInput) || 0;
  const projectedCost = currentActualCost + parsedAmount;
  const willTriggerApproval = parsedAmount > 0 && projectedCost >= COST_THRESHOLD;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());
    formData.set("expenseType", expenseType);

    const res = await createExpenseAction(formData);

    setLoading(false);

    if (res.success) {
      if ((res as any).requiresApproval) {
        setApprovalNotice((res as any).message);
      } else {
        onClose();
      }
    } else {
      setError(res.message);
    }
  }

  function handleNoticeClose() {
    setApprovalNotice(null);
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen && !approvalNotice} onClose={onClose} title={`Record Project Expense — #${projectCode}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* ── Threshold Warning Banner ─────────────────────────────── */}
          {willTriggerApproval && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl">
              <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold">Admin Approval Required</p>
                <p>
                  This expense will push the total monthly project actual cost to{" "}
                  <strong>{formatLKR(projectedCost)}</strong>, reaching the
                  LKR 5,000,000 threshold for the current month. The expense will be held for Admin
                  review before actual cost is updated.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Expense Type *
            </label>
            <Select
              options={EXPENSE_TYPE_OPTIONS}
              value={EXPENSE_TYPE_OPTIONS.find((opt) => opt.value === expenseType)}
              onChange={(opt) => setExpenseType(opt?.value || "LABOUR")}
              styles={getCustomSelectStyles()}
              isSearchable={false}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (LKR) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              name="amount"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Expense Date
            </label>
            <DatePicker
              selected={parseStringToDate(expenseDate)}
              onChange={(date: Date | null) => setExpenseDate(formatDateToString(date))}
              dateFormat="yyyy-MM-dd"
              showPopperArrow={false}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              wrapperClassName="w-full"
            />
            <input type="hidden" name="expenseDate" value={expenseDate} />
          </div>

          <FormInput
            label="Reference No (Receipt / Invoice / Voucher #)"
            name="referenceNo"
            placeholder="e.g. INV-2026-880"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description / Justification
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide context for this expenditure..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
            >
              Cancel
            </button>
            <FormButton loading={loading} fullWidth={false} className="w-52">
              {willTriggerApproval ? "Submit for Approval" : "Log Project Expense"}
            </FormButton>
          </div>
        </form>
      </Modal>

      {/* ── Custom Approval Notice UI Modal ──────────────────────────── */}
      <Modal
        isOpen={Boolean(approvalNotice)}
        onClose={handleNoticeClose}
        title="Admin Approval Required"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                Monthly Cost Threshold Exceeded (LKR 5,000,000)
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                {approvalNotice}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <span>The expense has been logged, but its actual cost is held in Pending status until approved.</span>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleNoticeClose}
              className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
            >
              Understood / OK
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default AddExpenseModal;
