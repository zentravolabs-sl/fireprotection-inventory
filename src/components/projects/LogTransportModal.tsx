"use client";

// ============================================================
// src/components/projects/LogTransportModal.tsx
// Modal for logging Project Transport entries
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createTransportAction } from "@/app/actions/transport";

interface LogTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectCode: string;
}

export function LogTransportModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
}: LogTransportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fuelCost, setFuelCost] = useState(0);
  const [vehicleHireCost, setVehicleHireCost] = useState(0);
  const [loadingCost, setLoadingCost] = useState(0);
  const [unloadingCost, setUnloadingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  const calculatedTotalCost =
    fuelCost + vehicleHireCost + loadingCost + unloadingCost + otherCost;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());

    const res = await createTransportAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Transport Entry — Project #${projectCode}`}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md text-xs text-blue-800 dark:text-blue-300">
          💡 <strong>Automatic Expense Rule:</strong> Transport total cost will automatically create a <code>TRANSPORT</code> expense in the project expense ledger.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormInput label="Vehicle Number *" name="vehicleNumber" placeholder="e.g. WP-CP-1024" required />
          <FormInput label="Driver Name *" name="driverName" placeholder="e.g. Sunil Perera" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormInput label="Transport Company" name="transportCompany" placeholder="e.g. Swift Logistics" />
          <FormInput label="Dispatch Location *" name="fromLocation" placeholder="Main Warehouse" required />
          <FormInput label="Destination Location *" name="toLocation" placeholder="Site Location" required />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Cost Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Cost</label>
              <input
                type="number"
                min="0"
                step="any"
                name="fuelCost"
                value={fuelCost}
                onChange={(e) => setFuelCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Hire</label>
              <input
                type="number"
                min="0"
                step="any"
                name="vehicleHireCost"
                value={vehicleHireCost}
                onChange={(e) => setVehicleHireCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loading Cost</label>
              <input
                type="number"
                min="0"
                step="any"
                name="loadingCost"
                value={loadingCost}
                onChange={(e) => setLoadingCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unloading Cost</label>
              <input
                type="number"
                min="0"
                step="any"
                name="unloadingCost"
                value={unloadingCost}
                onChange={(e) => setUnloadingCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Other Cost</label>
              <input
                type="number"
                min="0"
                step="any"
                name="otherCost"
                value={otherCost}
                onChange={(e) => setOtherCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-lg border flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-medium">Total Transport Cost</span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                LKR {calculatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remarks / Dispatch Notes
          </label>
          <textarea
            name="remarks"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            placeholder="Delivery instructions, gate passes, driver contacts..."
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
          <FormButton loading={loading}>Save Transport Record</FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default LogTransportModal;
