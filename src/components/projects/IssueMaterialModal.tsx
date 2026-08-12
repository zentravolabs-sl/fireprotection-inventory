"use client";

// ============================================================
// src/components/projects/IssueMaterialModal.tsx
// Store Keeper Modal to trigger automatic FIFO material issue
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { issueMaterialsFIFOAction } from "@/app/actions/material-issues";

interface ItemToIssue {
  inventoryName: string;
  qtyApproved: number;
  qtyIssued: number;
  unit: string;
}

interface IssueMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requestNo: string;
  items: ItemToIssue[];
}

export function IssueMaterialModal({
  isOpen,
  onClose,
  requestId,
  requestNo,
  items,
}: IssueMaterialModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState("Main Warehouse");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await issueMaterialsFIFOAction({
      requestId,
      warehouse,
    });

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Issue Materials (FIFO) — Request #${requestNo}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3.5 text-xs text-red-800 dark:text-red-300">
          ⚡ <strong>FIFO Stock Selection Rule:</strong> System will automatically pick stock from the oldest received warehouse batches.
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Dispatch Warehouse
          </label>
          <input
            type="text"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
          />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Approved Items to Issue:
          </h4>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const pending = item.qtyApproved - item.qtyIssued;
              return (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.inventoryName}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Approved: {item.qtyApproved} {item.unit} | Issued: {item.qtyIssued} |{" "}
                    <strong className="text-red-600 dark:text-red-400">
                      To Issue: {pending} {item.unit}
                    </strong>
                  </span>
                </div>
              );
            })}
          </div>
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
            Confirm FIFO Stock Issue
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}
