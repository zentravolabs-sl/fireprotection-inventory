"use client";

// ============================================================
// src/components/projects/ReturnMaterialModal.tsx
// Modal for Site Engineer to process material returns
// ============================================================

import React, { useState } from "react";
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
    unit: string;
  };
}

interface ReturnMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  engineerId: string;
  assignedMaterials: AssignedMaterialItem[];
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
  const [returnState, setReturnState] = useState<
    Record<number, { selected: boolean; qty: number; condition: "GOOD" | "DAMAGED" | "SCRAP" }>
  >(() => {
    const initial: Record<number, any> = {};
    assignedMaterials.forEach((item) => {
      initial[item.id] = { selected: false, qty: item.balanceQty, condition: "GOOD" };
    });
    return initial;
  });

  const availableToReturn = assignedMaterials.filter((m) => m.balanceQty > 0);

  function handleToggleSelect(id: number) {
    setReturnState((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id]?.selected },
    }));
  }

  function handleQtyChange(id: number, qty: number) {
    setReturnState((prev) => ({
      ...prev,
      [id]: { ...prev[id], qty },
    }));
  }

  function handleConditionChange(id: number, condition: "GOOD" | "DAMAGED" | "SCRAP") {
    setReturnState((prev) => ({
      ...prev,
      [id]: { ...prev[id], condition },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const itemsToReturn = availableToReturn
      .filter((m) => returnState[m.id]?.selected)
      .map((m) => ({
        projectMaterialId: m.id,
        inventoryId: m.inventoryId,
        qtyReturned: returnState[m.id].qty,
        condition: returnState[m.id].condition,
      }));

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

        {availableToReturn.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No assigned materials with remaining balance available for return.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Materials to Return *
            </label>

            {availableToReturn.map((item) => {
              const state = returnState[item.id] || {
                selected: false,
                qty: item.balanceQty,
                condition: "GOOD",
              };
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-sm space-y-2 transition-colors ${
                    state.selected
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {item.inventory.name} ({item.inventory.itemCode})
                      </span>
                    </label>
                    <span className="text-xs text-gray-500">
                      Balance: <strong className="text-gray-800 dark:text-gray-200">{item.balanceQty} {item.inventory.unit}</strong>
                    </span>
                  </div>

                  {state.selected && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Return Quantity</label>
                        <input
                          type="number"
                          min="0.1"
                          max={item.balanceQty}
                          step="any"
                          value={state.qty}
                          onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                          required
                          className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Condition</label>
                        <select
                          value={state.condition}
                          onChange={(e) =>
                            handleConditionChange(
                              item.id,
                              e.target.value as "GOOD" | "DAMAGED" | "SCRAP"
                            )
                          }
                          className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
                        >
                          <option value="GOOD">GOOD (Restock to Warehouse)</option>
                          <option value="DAMAGED">DAMAGED (Written Off)</option>
                          <option value="SCRAP">SCRAP (Written Off)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Return Remarks / Reason
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            placeholder="Excess site materials, damaged during transport, etc."
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
          <FormButton loading={loading} disabled={availableToReturn.length === 0}>
            Submit Return
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}
