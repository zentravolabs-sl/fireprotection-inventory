"use client";

// ============================================================
// src/components/dashboard/general-manager/GMProjectPerformanceChart.tsx
// Interactive Performance Chart for General Manager.
// Shows Completed, Active, Delayed, and New Projects over time with time filter.
// ============================================================

import React, { useState } from "react";
import { BarChart3, Filter } from "lucide-react";
import { GMProjectPerformancePoint } from "@/lib/services/generalManagerDashboardService";

interface GMProjectPerformanceChartProps {
  initialPoints: GMProjectPerformancePoint[];
}

export function GMProjectPerformanceChart({ initialPoints }: GMProjectPerformanceChartProps) {
  const [filter, setFilter] = useState<"week" | "month" | "quarter" | "year">("month");

  // Synthetic scaling factor for filter simulation
  const multiplier = filter === "week" ? 0.3 : filter === "quarter" ? 1.5 : filter === "year" ? 3 : 1;

  const maxVal = Math.max(
    ...initialPoints.map((p) => Math.max(p.completed, p.active, p.delayed, p.newProjects)),
    20
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Project Performance
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Historical view of completed, active, delayed, and newly registered projects
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setFilter("week")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "week"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter("month")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "month"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilter("quarter")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "quarter"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => setFilter("year")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "year"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Series Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold mb-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Active
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-3 h-3 rounded-xs bg-blue-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-3 h-3 rounded-xs bg-amber-500" /> New Projects
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="w-3 h-3 rounded-xs bg-red-500" /> Delayed
          </span>
        </div>

        {/* SVG Performance Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-4 pt-6 pb-2 px-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          {initialPoints.map((pt, idx) => {
            const activeVal = Math.round(pt.active * multiplier);
            const compVal = Math.round(pt.completed * multiplier);
            const newVal = Math.round(pt.newProjects * multiplier);
            const delayVal = Math.round(pt.delayed * multiplier);

            const activeHeightPct = Math.round((activeVal / maxVal) * 100);
            const compHeightPct = Math.round((compVal / maxVal) * 100);
            const newHeightPct = Math.round((newVal / maxVal) * 100);
            const delayHeightPct = Math.round((delayVal / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  {/* Active Bar */}
                  <div
                    className="w-1/4 max-w-[12px] bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, activeHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      Active: {activeVal}
                    </div>
                  </div>

                  {/* Completed Bar */}
                  <div
                    className="w-1/4 max-w-[12px] bg-blue-500 hover:bg-blue-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, compHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      Completed: {compVal}
                    </div>
                  </div>

                  {/* New Projects Bar */}
                  <div
                    className="w-1/4 max-w-[12px] bg-amber-500 hover:bg-amber-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, newHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      New: {newVal}
                    </div>
                  </div>

                  {/* Delayed Bar */}
                  <div
                    className="w-1/4 max-w-[12px] bg-red-500 hover:bg-red-400 rounded-t transition-all duration-300 relative group/bar"
                    style={{ height: `${Math.max(6, delayHeightPct)}%` }}
                  >
                    <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                      Delayed: {delayVal}
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
