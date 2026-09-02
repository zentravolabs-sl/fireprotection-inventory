"use client";

// ============================================================
// src/components/projects/ApproveRequestModal.tsx
// Purchase Engineer modal to review and approve/reject a material request.
// Rejection requires a note which is sent back to the engineer.
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { approveMaterialRequestAction } from "@/app/actions/material-requests";

interface RequestItem {
  id: number;
  qtyRequested: number;
  qtyApproved: number;
  inventory: {
    name: string;
    itemCode: string;
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
    // Rejection note is required
    if (decision === "REJECT" && !remarks.trim()) {
      setError("Rejection note is required. Please explain the reason for rejection so the engineer can make corrections.");
      return;
    }

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
      remarks: remarks.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Purchase Engineer Review — Request #${requestNo}`}>
      <div className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300">
          <span className="font-semibold">📋 Purchase Engineer Review:</span> Adjust approved quantities if needed, then approve or reject with a note. Approved requests will go to the Inventory Controller for FIFO issue.
        </div>

        {/* Item Quantities */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Review Requested Quantities
          </label>

          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {item.inventory.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-mono text-red-600 dark:text-red-400">{item.inventory.itemCode}</span>
                  {" · "}Requested:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.qtyRequested}
                  </span>
                </div>
              </div>

              <div className="w-36 shrink-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Qty to Approve</label>
                <input
                  type="number"
                  min="0"
                  max={item.qtyRequested}
                  step="any"
                  value={approvedQtys[item.id] ?? item.qtyRequested}
                  onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Remarks / Rejection Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Note / Rejection Reason
            <span className="ml-1.5 text-xs font-normal text-gray-400">(required when rejecting)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); setError(null); }}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="e.g. Quantities exceed project budget. Please reduce items X and Y..."
          />
          {/* Rejection note info */}
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            💡 If rejected, this note will be visible to the engineer so they can correct and resubmit the request.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction("REJECT")}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "✕"}
            Reject Request
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction("APPROVE")}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "✓"}
            Approve Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
