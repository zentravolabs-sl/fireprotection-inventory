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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-bold outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Estimated Cost Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Material Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedMaterialCost"
                value={estMat}
                onChange={(e) => setEstMat(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Labour Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedLabourCost"
                value={estLab}
                onChange={(e) => setEstLab(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Transport Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedTransportCost"
                value={estTrn}
                onChange={(e) => setEstTrn(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Equipment Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedEquipmentCost"
                value={estEqp}
                onChange={(e) => setEstEqp(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Other Cost
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="estimatedOtherCost"
                value={estOth}
                onChange={(e) => setEstOth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              />
            </div>

            <div className="bg-red-50/50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex flex-col justify-center">
              <span className="text-xs text-red-700 dark:text-red-300 font-medium uppercase tracking-wider">
                Est. Profit & Margin
              </span>
              <span className={`text-base font-bold ${calculatedEstimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
                LKR {calculatedEstimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({calculatedProfitMargin.toFixed(1)}%)
              </span>
            </div>
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
          <FormButton loading={loading} fullWidth={false} className="w-48">
            Save Financial Budget
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default UpdateProjectCostsModal;
