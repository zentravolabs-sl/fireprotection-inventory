"use client";

// ============================================================
// src/components/projects/ProjectEstimatesTab.tsx
// Tab for Project Managers / QS to set total estimated material requirements
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { ProjectEstimateMaterialItem } from "@/types/project";
import { usePermissions } from "@/hooks/usePermissions";
import {
  saveProjectEstimateAction,
  deleteProjectEstimateAction,
} from "@/app/actions/project-estimates";

interface InventoryItemOption {
  id: number;
  itemCode: string;
  name: string;
}

interface ProjectEstimatesTabProps {
  projectId: number;
  estimates: ProjectEstimateMaterialItem[];
  inventoryItems: InventoryItemOption[];
  onRefresh: () => void;
}

export function ProjectEstimatesTab({
  projectId,
  estimates = [],
  inventoryItems = [],
  onRefresh,
}: ProjectEstimatesTabProps) {
  const { can } = usePermissions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number>(0);
  const [estimatedQty, setEstimatedQty] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = can("project_material.manage_estimate");

  function handleOpenAddModal(item?: ProjectEstimateMaterialItem) {
    if (item) {
      setSelectedInventoryId(item.inventoryId);
      setEstimatedQty(item.estimatedQty.toString());
      setNotes(item.notes || "");
    } else {
      setSelectedInventoryId(0);
      setEstimatedQty("");
      setNotes("");
    }
    setError(null);
    setIsAddModalOpen(true);
  }

  async function handleSaveEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInventoryId || !estimatedQty) {
      setError("Please select an inventory item and enter an estimated quantity.");
      return;
    }

    const qty = parseFloat(estimatedQty);
    if (isNaN(qty) || qty <= 0) {
      setError("Estimated quantity must be greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await saveProjectEstimateAction({
      projectId,
      inventoryId: selectedInventoryId,
      estimatedQty: qty,
      notes: notes || undefined,
    });

    setLoading(false);

    if (res.success) {
      setIsAddModalOpen(false);
      onRefresh();
    } else {
      setError(res.message);
    }
  }

  async function handleDelete(estimateId: string) {
    if (!confirm("Are you sure you want to remove this material estimate?")) return;

    const res = await deleteProjectEstimateAction(projectId, estimateId);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📐 Total Estimated Project Materials
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Set expected total material quantities required for full project completion
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            + Add Estimated Material
          </button>
        )}
      </div>

      {/* ESTIMATES TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {estimates.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              No Estimated Materials Added Yet
            </p>
            <p>Project Managers and QS Engineers can add total material estimates to track material budgets.</p>
            {canManage && (
              <button
                onClick={() => handleOpenAddModal()}
                className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                + Add First Material Estimate
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">Item Code</th>
                  <th className="px-5 py-3.5">Material Name</th>
                  <th className="px-5 py-3.5">Unit</th>
                  <th className="px-5 py-3.5 text-right">Total Estimated Qty</th>
                  <th className="px-5 py-3.5">Notes</th>
                  {canManage && <th className="px-5 py-3.5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-4 font-mono font-bold text-red-600 dark:text-red-400">
                      {est.inventory.itemCode}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                      {est.inventory.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 font-medium">
                      —
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      {est.estimatedQty.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-gray-500 italic max-w-xs truncate">
                      {est.notes || "—"}
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleOpenAddModal(est)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(est.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD/EDIT ESTIMATE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedInventoryId ? "Edit Estimated Material" : "Add Estimated Material"}
      >
        <form onSubmit={handleSaveEstimate} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Inventory Material *
            </label>
            <Select
              instanceId="est-inventory-select"
              options={inventoryItems.map((inv) => ({
                value: inv.id,
                label: `${inv.itemCode} — ${inv.name}`,
              }))}
              value={
                inventoryItems
                  .filter((inv) => inv.id === selectedInventoryId)
                  .map((inv) => ({
                    value: inv.id,
                    label: `${inv.itemCode} — ${inv.name}`,
                  }))[0] || null
              }
              onChange={(val) => setSelectedInventoryId(val ? val.value : 0)}
              placeholder="Search inventory item..."
              isSearchable
              styles={getCustomSelectStyles()}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Total Estimated Quantity *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={estimatedQty}
              onChange={(e) => setEstimatedQty(e.target.value)}
              required
              placeholder="e.g. 500"
              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Notes / Planning Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <FormButton type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={loading}>
              Cancel
            </FormButton>
            <FormButton type="submit" loading={loading} disabled={loading}>
              Save Estimate
            </FormButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
