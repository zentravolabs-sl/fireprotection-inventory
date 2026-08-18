"use client";

// ============================================================
// src/app/(Main)/tools/components/ToolFilters.tsx
// Filter controls for Condition and Status of Tools using react-select.
// ============================================================

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";

const CONDITION_OPTIONS = [
  { value: "", label: "All Conditions" },
  { value: "New", label: "New" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Damaged", label: "Damaged" },
  { value: "UnderRepair", label: "Under Repair" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Available", label: "Available" },
  { value: "InUse", label: "In Use" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Lost", label: "Lost" },
  { value: "Retired", label: "Retired" },
];

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
    params.set("page", "1");
    router.push(`/tools?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("condition");
    params.delete("status");
    params.set("page", "1");
    router.push(`/tools?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(currentCondition || currentStatus);

  const selectedConditionOption =
    CONDITION_OPTIONS.find((opt) => opt.value === currentCondition) || CONDITION_OPTIONS[0];

  const selectedStatusOption =
    STATUS_OPTIONS.find((opt) => opt.value === currentStatus) || STATUS_OPTIONS[0];

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
          <Select
            instanceId="tool-condition-filter"
            classNamePrefix="react-select"
            options={CONDITION_OPTIONS}
            value={selectedConditionOption}
            onChange={(val) => updateParam("condition", val ? val.value : "")}
            isSearchable={false}
            styles={getCustomSelectStyles(false, "38px")}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <Select
            instanceId="tool-status-filter"
            classNamePrefix="react-select"
            options={STATUS_OPTIONS}
            value={selectedStatusOption}
            onChange={(val) => updateParam("status", val ? val.value : "")}
            isSearchable={false}
            styles={getCustomSelectStyles(false, "38px")}
          />
        </div>
      </div>
    </div>
  );
}

