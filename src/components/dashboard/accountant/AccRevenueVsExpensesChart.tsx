"use client";

// ============================================================
// src/components/dashboard/accountant/AccRevenueVsExpensesChart.tsx
// Main Financial Chart comparing Revenue, Expenses, and Net Profit.
// ============================================================

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { RevenueExpensePoint } from "@/lib/services/accountantDashboardService";

interface AccRevenueVsExpensesChartProps {
  points: RevenueExpensePoint[];
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

export function AccRevenueVsExpensesChart({ points }: AccRevenueVsExpensesChartProps) {
  const [filter, setFilter] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.revenue, p.expenses)),
    100000
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Revenue vs Expenses
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monthly breakdown of gross collections, expenditures & net profit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setFilter("monthly")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "monthly"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilter("quarterly")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "quarterly"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setFilter("yearly")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "yearly"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold mb-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="w-3 h-3 rounded-xs bg-red-500" /> Expenses
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-3 h-3 rounded-xs bg-blue-500" /> Net Profit
          </span>
        </div>

        {/* SVG Comparative Financial Chart */}
        <div className="h-56 flex items-end justify-between gap-4 pt-6 pb-2 px-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          {points.map((pt, idx) => {
            const revHeightPct = Math.round((pt.revenue / maxVal) * 100);
            const expHeightPct = Math.round((pt.expenses / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-40">
                  {/* Revenue Bar */}
                  <div
                    className="w-1/3 max-w-[16px] bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, revHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      Rev: {formatLKRShort(pt.revenue)}
                    </div>
                  </div>

                  {/* Expenses Bar */}
                  <div
                    className="w-1/3 max-w-[16px] bg-red-500 hover:bg-red-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, expHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      Exp: {formatLKRShort(pt.expenses)}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mt-2">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
