"use client";

// ============================================================
// src/components/projects/AddExpenseModal.tsx
// Modal for recording Labour, Equipment, and Other Project Expenses
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

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectCode: string;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
}: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseType, setExpenseType] = useState("LABOUR");

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
          📌 <strong>Manual Expense Ledger:</strong> Use this modal to manually enter Labour, Equipment, or Other project expenses. Material & Transport expenses are created automatically.
        </div>

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
          <FormInput
            label="Amount *"
            name="amount"
            type="number"
            min="0.01"
            step="any"
            placeholder="e.g. 25000"
            required
          />
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
          <FormButton loading={loading} fullWidth={false} className="w-40">
            Log Expense
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AddExpenseModal;
