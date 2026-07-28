"use client";

// ============================================================
// src/app/(Main)/admin/tools/components/ToolFilters.tsx
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
    router.push(`/admin/tools?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("condition");
    params.delete("status");
    router.push(`/admin/tools?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(currentCondition || currentStatus);

  return (
    <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] p-4 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#dce3ef] font-semibold text-sm">
          <Filter size={15} className="text-[#e02424]" />
          <span>Tool Filters</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e02424] hover:underline"
          >
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Condition Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Condition</label>
          <select
            value={currentCondition}
            onChange={(e) => updateParam("condition", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
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
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
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
