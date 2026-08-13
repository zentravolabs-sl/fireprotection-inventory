"use client";

// ============================================================
// src/app/(Main)/tools/components/ToolFilters.tsx
// Filter controls for Condition and Status of Tools.
// ============================================================

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

export default function ToolFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCondition = searchParams.get("condition") || "";
  const currentStatus = searchParams.get("status") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tools?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("condition");
    params.delete("status");
    router.push(`/tools?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(currentCondition || currentStatus);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold text-sm">
          <Filter size={15} className="text-red-600 dark:text-red-400" />
          <span>Tool Filters</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Condition Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
          <select
            value={currentCondition}
            onChange={(e) => updateParam("condition", e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Damaged">Damaged</option>
            <option value="UnderRepair">Under Repair</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="InUse">In Use</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>
    </div>
  );
}
