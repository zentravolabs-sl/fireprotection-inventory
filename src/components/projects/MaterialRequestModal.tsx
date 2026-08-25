"use client";

// ============================================================
// src/components/projects/MaterialRequestModal.tsx
// Modal for Engineers to create material requests with multi-item selection
// Shows custom UI Notice Modal when the LKR 5M threshold is reached
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { createMaterialRequestAction } from "@/app/actions/material-requests";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
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
      if ((res as any).requiresApproval) {
        setApprovalNotice((res as any).message);
      } else {
        onClose();
      }
    } else {
      setError(res.message);
    }
  }

  function handleNoticeClose() {
    setApprovalNotice(null);
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen && !approvalNotice} onClose={onClose} title="Create Material Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Requested Items *
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
                        instanceId={`mat-req-select-${idx}`}
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
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
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
                    <div className="text-[11px] flex justify-between text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span>Unit: {selectedInv.unit}</span>
                      <span className="font-semibold text-green-600">Available Stock: {selectedInv.availableStock} {selectedInv.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
            >
              + Add Another Item
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Remarks / Justification
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter site location, purpose, or reason for request..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <FormButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </FormButton>
            <FormButton type="submit" loading={loading} disabled={loading}>
              Submit Material Request
            </FormButton>
          </div>
        </form>
      </Modal>

      {/* LKR 5M THRESHOLD NOTIFICATION MODAL */}
      <Modal isOpen={!!approvalNotice} onClose={handleNoticeClose} title="Expense Approval Required">
        <div className="space-y-4 py-2">
          <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">Cost Approval Threshold Reached (LKR 5,000,000)</p>
              <p>{approvalNotice}</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <FormButton type="button" onClick={handleNoticeClose}>
              <CheckCircle2 className="w-4 h-4 mr-1.5 inline" /> Understood & Close
            </FormButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
