"use client";

// ============================================================
// src/components/projects/ApproveRequestModal.tsx
// PM Modal to review and approve/reject material request items
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { approveMaterialRequestAction } from "@/app/actions/material-requests";

interface RequestItem {
  id: number;
  qtyRequested: number;
  qtyApproved: number;
  inventory: {
    name: string;
    itemCode: string;
    unit: string;
  };
}

interface ApproveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requestNo: string;
  items: RequestItem[];
}

export function ApproveRequestModal({
  isOpen,
  onClose,
  requestId,
  requestNo,
  items,
}: ApproveRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [approvedQtys, setApprovedQtys] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    items.forEach((i) => {
      initial[i.id] = i.qtyApproved > 0 ? i.qtyApproved : i.qtyRequested;
    });
    return initial;
  });

  function handleQtyChange(itemId: number, qty: number) {
    setApprovedQtys({ ...approvedQtys, [itemId]: qty });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payloadItems = items.map((i) => ({
      itemId: i.id,
      qtyApproved: approvedQtys[i.id] ?? 0,
    }));

    const res = await approveMaterialRequestAction({
      requestId,
      items: payloadItems,
      remarks,
    });

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Approve Request #${requestNo}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Review Item Quantities *
          </label>

          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {item.inventory.name}
                </div>
                <div className="text-xs text-gray-500">
                  Code: {item.inventory.itemCode} | Requested:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.qtyRequested} {item.inventory.unit}
                  </span>
                </div>
              </div>

              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1">Qty Approved</label>
                <input
                  type="number"
                  min="0"
                  max={item.qtyRequested}
                  step="any"
                  value={approvedQtys[item.id] ?? item.qtyRequested}
                  onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                  required
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Approval Remarks / Notes
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            placeholder="Approval comments or conditions..."
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
          <FormButton loading={loading}>Save Approval</FormButton>
        </div>
      </form>
    </Modal>
  );
}
