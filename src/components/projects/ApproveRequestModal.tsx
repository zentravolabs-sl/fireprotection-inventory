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

  async function handleAction(decision: "APPROVE" | "REJECT") {
    setLoading(true);
    setError(null);

    const payloadItems = items.map((i) => ({
      itemId: i.id,
      qtyApproved: approvedQtys[i.id] ?? 0,
    }));

    const res = await approveMaterialRequestAction({
      requestId,
      decision,
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Request #${requestNo}`}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Review Item Quantities *
          </label>

          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4"
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Qty Approved</label>
                <input
                  type="number"
                  min="0"
                  max={item.qtyRequested}
                  step="any"
                  value={approvedQtys[item.id] ?? item.qtyRequested}
                  onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Decision Remarks / Rejection Reason
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Review comments or rejection reason..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction("REJECT")}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            ❌ Reject Request
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction("APPROVE")}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            ✓ Approve Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
