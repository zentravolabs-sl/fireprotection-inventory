"use client";

// ============================================================
// src/components/projects/AddExpenseModal.tsx
// Modal for recording Labour, Equipment, and Other Project Expenses
// Shows a warning banner when the entered amount would push
// actual cost to/above the LKR 5,000,000 Super Admin threshold.
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createExpenseAction } from "@/app/actions/expenses";

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
  const [expenseType, setExpenseType] = useState("LABOUR");
  const [amountInput, setAmountInput] = useState("");

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
        alert((res as any).message);
      }
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Project Expense — #${projectCode}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-800 dark:text-red-300">
          📌 <strong>Manual Expense Ledger:</strong> Use this modal to manually enter Labour, Equipment, or Other project expenses. Material &amp; Transport expenses are created automatically.
        </div>

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
            instanceId="expense-type-select"
            options={EXPENSE_TYPE_OPTIONS}
            value={EXPENSE_TYPE_OPTIONS.find((opt) => opt.value === expenseType)}
            onChange={(val) => val && setExpenseType(val.value)}
            isSearchable={false}
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount *
            </label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 25000"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <FormInput
            label="Expense Date"
            name="expenseDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>

        <FormInput
          label="Reference / Invoice No."
          name="referenceNo"
          placeholder="e.g. INV-2026-880 or Wage Sheet #4"
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Description / Details *
          </label>
          <textarea
            name="description"
            required
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Provide detail on site labour count, equipment specs, or testing fees..."
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
          <FormButton loading={loading} fullWidth={false} className="w-48">
            {willTriggerApproval ? "Submit for Approval" : "Log Expense"}
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AddExpenseModal;
