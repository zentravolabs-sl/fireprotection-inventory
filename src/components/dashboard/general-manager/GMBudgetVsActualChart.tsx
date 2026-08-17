"use client";

// ============================================================
// src/components/dashboard/general-manager/GMBudgetVsActualChart.tsx
// Financial Management Widget: Budget vs Actual Comparison.
// Displays budget, actual spending, remaining budget, and Over Budget warnings.
// ============================================================

import React, { useState } from "react";
import { DollarSign, AlertCircle } from "lucide-react";
import { GMBudgetVsActualItem } from "@/lib/services/generalManagerDashboardService";

interface GMBudgetVsActualChartProps {
  items: GMBudgetVsActualItem[];
}

function formatLKRShort(val: number): string {
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.?0+$/, "");
    return `Rs. ${str}M`;
  }
  if (val >= 1_000) {
    const num = val / 1_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(0);
    return `Rs. ${str}K`;
  }
  return `Rs. ${val.toLocaleString()}`;
}

export function GMBudgetVsActualChart({ items }: GMBudgetVsActualChartProps) {
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "quarter" | "year">("all");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Title & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Budget vs Actual
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compare contract budgets against live approved expenditures
              </p>
            </div>
          </div>

          {/* Period Filters */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setPeriodFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                periodFilter === "all"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPeriodFilter("month")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                periodFilter === "month"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setPeriodFilter("quarter")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                periodFilter === "quarter"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setPeriodFilter("year")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                periodFilter === "year"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Project Budget vs Actual Bars */}
        <div className="space-y-4 my-2">
          {items.slice(0, 5).map((item) => {
            const max = Math.max(item.budget, item.actual, 1);
            const budgetPct = Math.min(100, Math.round((item.budget / max) * 100));
            const actualPct = Math.min(100, Math.round((item.actual / max) * 100));

            return (
              <div
                key={item.id}
                className="p-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                    {item.projectName}
                  </span>
                  {item.isOverBudget && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
                      <AlertCircle size={10} /> Over Budget
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono mb-2">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-sans">Budget</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatLKRShort(item.budget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-sans">Actual</span>
                    <span className={`font-bold ${item.isOverBudget ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatLKRShort(item.actual)}
                    </span>
                  </div>
                </div>

                {/* Comparative Horizontal Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${budgetPct}%` }} />
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.isOverBudget ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${actualPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
