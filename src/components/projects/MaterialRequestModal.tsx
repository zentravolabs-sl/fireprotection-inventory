"use client";

// ============================================================
// src/components/projects/MaterialRequestModal.tsx
// Modal for Engineers to create material requests with multi-item selection
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { createMaterialRequestAction } from "@/app/actions/material-requests";

interface InventoryItemOption {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
  availableStock: number;
}

interface MaterialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  engineerId: string;
  inventoryItems: InventoryItemOption[];
}

export function MaterialRequestModal({
  isOpen,
  onClose,
  projectId,
  engineerId,
  inventoryItems,
}: MaterialRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [requestItems, setRequestItems] = useState<
    { inventoryId: number; qtyRequested: number }[]
  >([{ inventoryId: 0, qtyRequested: 1 }]);

  function handleAddItem() {
    setRequestItems([...requestItems, { inventoryId: 0, qtyRequested: 1 }]);
  }

  function handleRemoveItem(index: number) {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((_, i) => i !== index));
    }
  }

  function handleItemChange(index: number, field: "inventoryId" | "qtyRequested", value: number) {
    const updated = [...requestItems];
    updated[index][field] = value;
    setRequestItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validItems = requestItems.filter(
      (i) => i.inventoryId > 0 && i.qtyRequested > 0
    );

    if (validItems.length === 0) {
      setLoading(false);
      setError("Please select at least one valid inventory item.");
      return;
    }

    const res = await createMaterialRequestAction({
      projectId,
      engineerId,
      remarks,
      items: validItems,
    });

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Material Request">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Requested Items *
          </label>

          {requestItems.map((item, idx) => {
            const selectedInv = inventoryItems.find((inv) => inv.id === item.inventoryId);
            return (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={item.inventoryId}
                      onChange={(e) =>
                        handleItemChange(idx, "inventoryId", Number(e.target.value))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="0" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Select Material...</option>
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          {inv.itemCode} - {inv.name} (Stock: {inv.availableStock} {inv.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.qtyRequested}
                      onChange={(e) =>
                        handleItemChange(idx, "qtyRequested", Number(e.target.value))
                      }
                      required
                      placeholder="Qty"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {requestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1 text-lg font-bold"
                      title="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>

                {selectedInv && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between pt-1">
                    <span>Unit: {selectedInv.unit}</span>
                    <span
                      className={`font-medium ${
                        selectedInv.availableStock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Available Stock: {selectedInv.availableStock} {selectedInv.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddItem}
            className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline flex items-center gap-1"
          >
            + Add Another Item
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remarks / Justification
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            placeholder="Reason for request, zone location, urgency..."
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
          <FormButton loading={loading}>Submit Request</FormButton>
        </div>
      </form>
    </Modal>
  );
}
