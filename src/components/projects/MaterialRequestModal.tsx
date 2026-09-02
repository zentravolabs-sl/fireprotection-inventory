"use client";

// ============================================================
// src/components/projects/MaterialRequestModal.tsx
// Modal for Engineers to create material requests with multi-item selection.
// Enforces estimate-first rule: can only request up to remaining estimate qty.
// Once estimate is fully exhausted, additional requests are allowed freely.
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
  availableStock: number;
  estimatedQty: number | null;
  alreadyRequestedQty: number;
  remainingEstimate: number | null;
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
  inventoryItems = [],
}: MaterialRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  const estimatedItems = React.useMemo(() => {
    return (inventoryItems || []).filter((inv) => inv.estimatedQty !== null);
  }, [inventoryItems]);

  const getInitialRequestItems = React.useCallback(() => {
    const est = (inventoryItems || []).filter((inv) => inv.estimatedQty !== null);
    if (est.length > 0) {
      return est.map((inv) => ({
        inventoryId: inv.id,
        qtyRequested:
          inv.remainingEstimate !== null && inv.remainingEstimate > 0
            ? inv.remainingEstimate
            : 1,
      }));
    }
    return [{ inventoryId: 0, qtyRequested: 1 }];
  }, [inventoryItems]);

  const [requestItems, setRequestItems] = useState<
    { inventoryId: number; qtyRequested: number }[]
  >(getInitialRequestItems);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRequestItems(getInitialRequestItems());
      setRemarks("");
      setError(null);
      setApprovalNotice(null);
    }
  }, [isOpen, getInitialRequestItems]);

  // Sort options: Estimated items first, then alphabetical by name
  const sortedInventoryItems = React.useMemo(() => {
    return [...(inventoryItems || [])].sort((a, b) => {
      const aIsEst = a.estimatedQty !== null ? 1 : 0;
      const bIsEst = b.estimatedQty !== null ? 1 : 0;
      if (aIsEst !== bIsEst) {
        return bIsEst - aIsEst;
      }
      return a.name.localeCompare(b.name);
    });
  }, [inventoryItems]);

  const selectOptions = React.useMemo(() => {
    return sortedInventoryItems.map((inv) => ({
      value: inv.id,
      label: `${inv.estimatedQty !== null ? "📐 [ESTIMATED] " : ""}${inv.itemCode} - ${inv.name}${
        inv.estimatedQty !== null
          ? ` | Est: ${inv.estimatedQty}${
              inv.remainingEstimate !== null && inv.remainingEstimate > 0
                ? ` (Rem: ${inv.remainingEstimate})`
                : inv.remainingEstimate === 0
                ? " ✓ Est. done — additional OK"
                : ""
            }`
          : ` (Stock: ${inv.availableStock})`
      }`,
    }));
  }, [sortedInventoryItems]);

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
    // When inventory changes, reset qty to 1 and auto-set to remaining estimate if applicable
    if (field === "inventoryId") {
      const inv = inventoryItems.find((i) => i.id === value);
      const defaultQty =
        inv && inv.remainingEstimate !== null && inv.remainingEstimate > 0
          ? inv.remainingEstimate
          : 1;
      updated[index] = { inventoryId: value, qtyRequested: defaultQty };
    } else {
      updated[index][field] = value;
    }
    setRequestItems(updated);
    setError(null);
  }

  // Client-side validation of qty against estimate limits
  function validateQty(inventoryId: number, qtyRequested: number): string | null {
    const inv = inventoryItems.find((i) => i.id === inventoryId);
    if (!inv) return null;

    // If remaining estimate > 0 and request exceeds it → warn
    if (inv.remainingEstimate !== null && inv.remainingEstimate > 0 && qtyRequested > inv.remainingEstimate) {
      return `Max allowed within estimate: ${inv.remainingEstimate} (Estimate: ${inv.estimatedQty}, Already requested: ${inv.alreadyRequestedQty})`;
    }
    return null;
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

    // Client-side estimate validation before submit
    for (const item of validItems) {
      const err = validateQty(item.inventoryId, item.qtyRequested);
      if (err) {
        setLoading(false);
        setError(err);
        return;
      }
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
            <div className="p-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Banner for Estimated Materials */}
          {estimatedItems.length > 0 ? (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center space-x-2">
                <span className="text-base">📐</span>
                <div>
                  <span className="font-bold">Project Estimate Loaded:</span> Pre-filled with {estimatedItems.length} item(s) added in the Estimated tab.
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setRequestItems(getInitialRequestItems())}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-100 text-[11px] font-semibold rounded-lg transition-colors"
                >
                  🔄 Reset
                </button>
                <button
                  type="button"
                  onClick={() => setRequestItems([{ inventoryId: 0, qtyRequested: 1 }])}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-lg transition-colors"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">
              ℹ️ No materials estimated yet for this project. Select any warehouse inventory item below.
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Requested Items *
            </label>

            {requestItems.map((item, idx) => {
              const selectedInv = inventoryItems.find((inv) => inv.id === item.inventoryId);
              const qtyErr = selectedInv ? validateQty(item.inventoryId, item.qtyRequested) : null;

              // Estimate state for this item
              const hasEstimate = selectedInv?.estimatedQty !== null;
              const estimateExhausted =
                hasEstimate &&
                selectedInv !== undefined &&
                selectedInv.remainingEstimate !== null &&
                selectedInv.remainingEstimate <= 0;
              const remainingEstimate = selectedInv?.remainingEstimate ?? null;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
                    qtyErr
                      ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        instanceId={`mat-req-select-${idx}`}
                        options={selectOptions}
                        value={
                          selectOptions.find((opt) => opt.value === item.inventoryId) || null
                        }
                        onChange={(val) =>
                          handleItemChange(idx, "inventoryId", val ? val.value : 0)
                        }
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
                        min="0.01"
                        step="any"
                        max={
                          selectedInv && remainingEstimate !== null && remainingEstimate > 0
                            ? remainingEstimate
                            : undefined
                        }
                        value={item.qtyRequested}
                        onChange={(e) =>
                          handleItemChange(idx, "qtyRequested", Number(e.target.value))
                        }
                        required
                        placeholder="Qty"
                        className={`w-full px-3 py-2.5 border rounded-xl text-gray-900 dark:text-gray-100 font-bold text-xs outline-none focus:ring-1 transition-colors ${
                          qtyErr
                            ? "border-red-400 bg-red-50 dark:bg-red-950/30 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-red-500 focus:ring-red-200"
                        }`}
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

                  {/* Info row per item */}
                  {selectedInv && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1">
                      {hasEstimate ? (
                        <>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            <span className="text-gray-500">
                              📐 Total Estimate:{" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {selectedInv.estimatedQty}
                              </span>
                            </span>
                            <span className="text-gray-500">
                              📋 Already Requested:{" "}
                              <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {selectedInv.alreadyRequestedQty}
                              </span>
                            </span>
                            {estimateExhausted ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ✅ Estimate fully used — additional request allowed
                              </span>
                            ) : (
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                🔖 Remaining within estimate:{" "}
                                <strong>{remainingEstimate}</strong>
                              </span>
                            )}
                            <span className="text-gray-400">
                              Warehouse Stock: {selectedInv.availableStock}
                            </span>
                          </div>

                          {/* Qty error message */}
                          {qtyErr && (
                            <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                              ⚠ {qtyErr}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Item</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            Available Stock: {selectedInv.availableStock}
                          </span>
                        </div>
                      )}
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

