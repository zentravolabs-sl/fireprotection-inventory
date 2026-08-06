"use client";

// ============================================================
// src/components/projects/AddExpenseModal.tsx
// Modal for recording Labour, Equipment, and Other Project Expenses
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createExpenseAction } from "@/app/actions/expenses";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());

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

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-800 dark:text-amber-300">
          📌 <strong>Manual Expense Ledger:</strong> Use this modal to manually enter Labour, Equipment, or Other project expenses. Material & Transport expenses are created automatically.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expense Type *
          </label>
          <select
            name="expenseType"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
          >
            <option value="LABOUR">LABOUR (On-site sub-contractor / labour wages)</option>
            <option value="EQUIPMENT">EQUIPMENT (Scaffolding, Crane, Machinery hire)</option>
            <option value="OTHER">OTHER (Permits, testing fees, site utilities)</option>
          </select>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description / Details *
          </label>
          <textarea
            name="description"
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            placeholder="Provide detail on site labour count, equipment specs, or testing fees..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancel
          </button>
          <FormButton loading={loading}>Log Expense</FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AddExpenseModal;
