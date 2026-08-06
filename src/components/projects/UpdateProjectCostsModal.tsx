"use client";

// ============================================================
// src/components/projects/UpdateProjectCostsModal.tsx
// Modal dialog to set/update Project Value & Estimated Costs
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { updateProjectCostsAction } from "@/app/actions/projects";

interface UpdateProjectCostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectCode: string;
  initialEstimates: {
    projectValue: number;
    estimatedMaterialCost: number;
    estimatedLabourCost: number;
    estimatedTransportCost: number;
    estimatedEquipmentCost: number;
    estimatedOtherCost: number;
  };
}

export function UpdateProjectCostsModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
  initialEstimates,
}: UpdateProjectCostsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projVal, setProjVal] = useState(initialEstimates.projectValue || 0);
  const [estMat, setEstMat] = useState(initialEstimates.estimatedMaterialCost || 0);
  const [estLab, setEstLab] = useState(initialEstimates.estimatedLabourCost || 0);
  const [estTrn, setEstTrn] = useState(initialEstimates.estimatedTransportCost || 0);
  const [estEqp, setEstEqp] = useState(initialEstimates.estimatedEquipmentCost || 0);
  const [estOth, setEstOth] = useState(initialEstimates.estimatedOtherCost || 0);

  const calculatedTotalCost = estMat + estLab + estTrn + estEqp + estOth;
  const calculatedEstimatedProfit = projVal - calculatedTotalCost;
  const calculatedProfitMargin = projVal > 0 ? (calculatedEstimatedProfit / projVal) * 100 : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());

    const res = await updateProjectCostsAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Project Financials — #${projectCode}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
            Project Value (LKR) — Customer Price *
          </label>
          <input
            type="number"
            min="0"
            step="any"
            name="projectValue"
            value={projVal}
            onChange={(e) => setProjVal(Number(e.target.value))}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm font-bold focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Estimated Cost Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Est. Material Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedMaterialCost"
                value={estMat}
                onChange={(e) => setEstMat(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Est. Labour Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedLabourCost"
                value={estLab}
                onChange={(e) => setEstLab(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Est. Transport Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedTransportCost"
                value={estTrn}
                onChange={(e) => setEstTrn(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Est. Equipment Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedEquipmentCost"
                value={estEqp}
                onChange={(e) => setEstEqp(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Est. Other Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedOtherCost"
                value={estOth}
                onChange={(e) => setEstOth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 flex flex-col justify-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium uppercase tracking-wider">
                Est. Profit & Margin
              </span>
              <span className={`text-base font-bold ${calculatedEstimatedProfit >= 0 ? "text-emerald-900 dark:text-emerald-100" : "text-red-600"}`}>
                LKR {calculatedEstimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({calculatedProfitMargin.toFixed(1)}%)
              </span>
            </div>
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
          <FormButton loading={loading}>Save Financial Budget</FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default UpdateProjectCostsModal;
