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

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-xs text-amber-800 dark:text-amber-300">
          ⚡ <strong>FIFO Stock Selection Rule:</strong> System will automatically pick stock from the oldest received warehouse batches.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dispatch Warehouse
          </label>
          <input
            type="text"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
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
                  className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.inventoryName}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Approved: {item.qtyApproved} {item.unit} | Issued: {item.qtyIssued} |{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      To Issue: {pending} {item.unit}
                    </strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancel
          </button>
          <FormButton loading={loading}>Confirm FIFO Stock Issue</FormButton>
        </div>
      </form>
    </Modal>
  );
}
