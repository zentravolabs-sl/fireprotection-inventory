"use client";

// ============================================================
// src/components/projects/EditMaterialRequestModal.tsx
// Modal for Engineers to edit & resubmit rejected material requests
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { resubmitMaterialRequestAction } from "@/app/actions/material-requests";

interface InventoryItemOption {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
  availableStock: number;
}

interface ExistingItem {
  id: number;
  inventoryId: number;
  qtyRequested: number;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
}

interface EditMaterialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requestNo: string;
  initialRemarks?: string | null;
  initialItems: ExistingItem[];
  inventoryItems: InventoryItemOption[];
}

export function EditMaterialRequestModal({
  isOpen,
  onClose,
  requestId,
  requestNo,
  initialRemarks = "",
  initialItems,
  inventoryItems,
}: EditMaterialRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState(initialRemarks || "");
  const [requestItems, setRequestItems] = useState<
    { inventoryId: number; qtyRequested: number }[]
  >(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((i) => ({
        inventoryId: i.inventoryId || i.inventory?.id || 0,
        qtyRequested: i.qtyRequested || 1,
      }));
    }
    return [{ inventoryId: 0, qtyRequested: 1 }];
  });

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

    const res = await resubmitMaterialRequestAction({
      requestId,
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit & Resubmit Request #${requestNo}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          ⚠️ This request was previously rejected. Updating items will reset the status to <strong>PENDING GM</strong> for review.
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Updated Request Items *
          </label>

          {requestItems.map((item, idx) => {
            const selectedInv = inventoryItems.find((inv) => inv.id === item.inventoryId);
            return (
              <div
                key={idx}
                className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      instanceId={`edit-mat-req-select-${idx}`}
                      options={inventoryItems.map((inv) => ({
                        value: inv.id,
                        label: `${inv.itemCode} - ${inv.name} (Stock: ${inv.availableStock} ${inv.unit})`,
                      }))}
                      value={
                        inventoryItems
                          .filter((inv) => inv.id === item.inventoryId)
                          .map((inv) => ({
                            value: inv.id,
                            label: `${inv.itemCode} - ${inv.name} (Stock: ${inv.availableStock} ${inv.unit})`,
                          }))[0] || null
                      }
                      onChange={(val) => handleItemChange(idx, "inventoryId", val ? val.value : 0)}
                      placeholder="Select Material..."
                      isSearchable
                      isClearable
                      menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                      styles={getCustomSelectStyles()}
                    />
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
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                    />
                  </div>

                  {requestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 p-2 text-lg font-bold"
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
                      className={`font-medium ${selectedInv.availableStock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
            className="text-sm text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
          >
            + Add Another Item
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Updated Remarks / Justification
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none"
            placeholder="Updated justification for resubmission..."
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
          <FormButton loading={loading} fullWidth={false} className="w-44">
            Resubmit Request
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}
