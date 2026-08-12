"use client";

// ============================================================
// src/components/tools/ReturnToolModal.tsx
// Modal to return a single assigned tool with condition inspection.
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { returnToolItemAction } from "@/app/actions/tool-assignments";

interface ReturnToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    toolName: string;
    toolCode: string;
    serialNo: string;
    conditionAtIssue: string;
  };
}

type ReturnCondition = "Good" | "Damaged" | "Lost";

const conditions: { value: ReturnCondition; label: string; description: string; color: string }[] = [
  {
    value: "Good",
    label: "✅ Good",
    description: "Tool is in working condition — will be set to Available",
    color: "border-green-400 bg-green-50 dark:bg-green-950/20",
  },
  {
    value: "Damaged",
    label: "⚠️ Damaged",
    description: "Tool needs repair — will be set to Under Repair (Maintenance)",
    color: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
  },
  {
    value: "Lost",
    label: "❌ Lost",
    description: "Tool cannot be found — will be marked as Lost",
    color: "border-red-400 bg-red-50 dark:bg-red-950/20",
  },
];

export function ReturnToolModal({ isOpen, onClose, item }: ReturnToolModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [condition, setCondition] = useState<ReturnCondition>("Good");
  const [remarks, setRemarks] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("itemId", item.id.toString());
    formData.set("condition", condition);
    formData.set("remarks", remarks);

    const res = await returnToolItemAction(formData);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="↩ Return Tool" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Tool Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tool Being Returned</p>
          <p className="font-bold text-gray-900 dark:text-gray-100">{item.toolName}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Code: <strong className="text-red-600 font-mono">{item.toolCode}</strong></span>
            <span>Serial: <strong className="font-mono">{item.serialNo}</strong></span>
          </div>
          <div className="text-xs text-gray-500">
            Condition at Issue:{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{item.conditionAtIssue}</span>
          </div>
        </div>

        {/* Condition Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Return Condition *
          </label>
          <div className="space-y-2">
            {conditions.map((c) => (
              <label
                key={c.value}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  condition === c.value
                    ? c.color + " border-opacity-100"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={c.value}
                  checked={condition === c.value}
                  onChange={() => setCondition(c.value)}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Inspection Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe the condition of the tool upon return..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
          >
            Cancel
          </button>
          <FormButton loading={loading} loadingText="Processing..." fullWidth={false} className="w-40">
            ↩ Return Tool
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default ReturnToolModal;
