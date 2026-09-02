"use client";

// ============================================================
// src/components/projects/ReturnMaterialModal.tsx
// Modal for Site Engineer to process material returns
// ============================================================

import React, { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { returnMaterialsAction } from "@/app/actions/material-returns";

interface AssignedMaterialItem {
  id: number; // projectMaterialId
  inventoryId: number;
  issuedQty: number;
  returnedQty: number;
  balanceQty: number;
  inventory: {
    name: string;
    itemCode: string;
  };
}

interface ReturnMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  engineerId: string;
  assignedMaterials: AssignedMaterialItem[];
}

interface GroupedMaterialItem {
  inventoryId: number;
  name: string;
  itemCode: string;
  totalIssuedQty: number;
  totalReturnedQty: number;
  totalBalanceQty: number;
  records: AssignedMaterialItem[];
}

export function ReturnMaterialModal({
  isOpen,
  onClose,
  projectId,
  engineerId,
  assignedMaterials,
}: ReturnMaterialModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  // Group assigned materials by inventoryId so items issued from multiple FIFO batches are consolidated into a single entry
  const groupedMaterials = useMemo(() => {
    const map = new Map<number, GroupedMaterialItem>();

    assignedMaterials.forEach((item) => {
      if (item.balanceQty <= 0) return;

      const existing = map.get(item.inventoryId);
      if (existing) {
        existing.totalIssuedQty += item.issuedQty;
        existing.totalReturnedQty += item.returnedQty;
        existing.totalBalanceQty += item.balanceQty;
        existing.records.push(item);
      } else {
        map.set(item.inventoryId, {
          inventoryId: item.inventoryId,
          name: item.inventory.name,
          itemCode: item.inventory.itemCode,
          totalIssuedQty: item.issuedQty,
          totalReturnedQty: item.returnedQty,
          totalBalanceQty: item.balanceQty,
          records: [item],
        });
      }
    });

    return Array.from(map.values());
  }, [assignedMaterials]);

  const [returnState, setReturnState] = useState<
    Record<number, { selected: boolean; qty: number; condition: "GOOD" | "DAMAGED" | "SCRAP" }>
  >({});

  // Initialize or reset returnState whenever groupedMaterials changes
  useEffect(() => {
    const initial: Record<number, { selected: boolean; qty: number; condition: "GOOD" | "DAMAGED" | "SCRAP" }> = {};
    groupedMaterials.forEach((item) => {
      initial[item.inventoryId] = { selected: false, qty: item.totalBalanceQty, condition: "GOOD" };
    });
    setReturnState(initial);
  }, [groupedMaterials]);

  function handleToggleSelect(inventoryId: number) {
    setReturnState((prev) => ({
      ...prev,
      [inventoryId]: {
        selected: !prev[inventoryId]?.selected,
        qty: prev[inventoryId]?.qty || groupedMaterials.find((m) => m.inventoryId === inventoryId)?.totalBalanceQty || 0,
        condition: prev[inventoryId]?.condition || "GOOD",
      },
    }));
  }

  function handleQtyChange(inventoryId: number, qty: number) {
    setReturnState((prev) => ({
      ...prev,
      [inventoryId]: { ...prev[inventoryId], qty },
    }));
  }

  function handleConditionChange(inventoryId: number, condition: "GOOD" | "DAMAGED" | "SCRAP") {
    setReturnState((prev) => ({
      ...prev,
      [inventoryId]: { ...prev[inventoryId], condition },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const itemsToReturn: {
      projectMaterialId: number;
      inventoryId: number;
      qtyReturned: number;
      condition: "GOOD" | "DAMAGED" | "SCRAP";
    }[] = [];

    const selectedGroupedItems = groupedMaterials.filter(
      (m) => returnState[m.inventoryId]?.selected
    );

    for (const group of selectedGroupedItems) {
      const state = returnState[group.inventoryId];
      if (!state || state.qty <= 0) continue;

      if (state.qty > group.totalBalanceQty) {
        setLoading(false);
        setError(
          `Return quantity (${state.qty}) for "${group.name}" cannot exceed available balance (${group.totalBalanceQty}).`
        );
        return;
      }

      let remainingQtyToReturn = state.qty;
      // Sort records LIFO (newest batch allocation first)
      const sortedRecords = [...group.records].sort((a, b) => b.id - a.id);

      for (const rec of sortedRecords) {
        if (remainingQtyToReturn <= 0) break;
        const qtyDrawn = Math.min(rec.balanceQty, remainingQtyToReturn);
        if (qtyDrawn > 0) {
          itemsToReturn.push({
            projectMaterialId: rec.id,
            inventoryId: group.inventoryId,
            qtyReturned: qtyDrawn,
            condition: state.condition,
          });
          remainingQtyToReturn -= qtyDrawn;
        }
      }
    }

    if (itemsToReturn.length === 0) {
      setLoading(false);
      setError("Please select at least one material to return.");
      return;
    }

    const res = await returnMaterialsAction({
      projectId,
      engineerId,
      remarks,
      items: itemsToReturn,
    });

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Return Unused Materials">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {groupedMaterials.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No assigned materials with remaining balance available for return.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Materials to Return *
            </label>

            {groupedMaterials.map((item) => {
              const state = returnState[item.inventoryId] || {
                selected: false,
                qty: item.totalBalanceQty,
                condition: "GOOD",
              };
              return (
                <div
                  key={item.inventoryId}
                  className={`p-3.5 rounded-xl border text-sm space-y-2 transition-colors ${state.selected
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2.5 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => handleToggleSelect(item.inventoryId)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">
                        {item.name} ({item.itemCode})
                      </span>
                    </label>
                    <span className="text-xs text-gray-500">
                      Balance: <strong className="text-gray-800 dark:text-gray-200">{item.totalBalanceQty}</strong>
                    </span>
                  </div>

                  {state.selected && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Return Quantity</label>
                        <input
                          type="number"
                          min="0.1"
                          max={item.totalBalanceQty}
                          step="any"
                          value={state.qty}
                          onChange={(e) => handleQtyChange(item.inventoryId, Number(e.target.value))}
                          required
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Condition</label>
                        <Select
                          instanceId={`return-condition-select-${item.inventoryId}`}
                          options={[
                            { value: "GOOD", label: "GOOD (Restock to Warehouse)" },
                            { value: "DAMAGED", label: "DAMAGED (Written Off)" },
                            { value: "SCRAP", label: "SCRAP (Written Off)" },
                          ]}
                          value={
                            state.condition === "GOOD"
                              ? { value: "GOOD", label: "GOOD (Restock to Warehouse)" }
                              : state.condition === "DAMAGED"
                                ? { value: "DAMAGED", label: "DAMAGED (Written Off)" }
                                : { value: "SCRAP", label: "SCRAP (Written Off)" }
                          }
                          onChange={(val) =>
                            val && handleConditionChange(item.inventoryId, val.value as "GOOD" | "DAMAGED" | "SCRAP")
                          }
                          isSearchable={false}
                          menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                          styles={getCustomSelectStyles()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Return Remarks / Reason
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Excess site materials, damaged during transport, etc."
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
          <FormButton loading={loading} disabled={groupedMaterials.length === 0} fullWidth={false} className="w-40">
            Submit Return
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

