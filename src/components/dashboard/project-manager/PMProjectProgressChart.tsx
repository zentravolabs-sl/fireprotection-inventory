"use client";

// ============================================================
// src/components/dashboard/project-manager/PMProjectProgressChart.tsx
// Project Progress Chart with status filters for Project Manager.
// ============================================================

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { PMProjectProgressItem } from "@/lib/services/projectManagerDashboardService";

interface PMProjectProgressChartProps {
  projects: PMProjectProgressItem[];
}

export function PMProjectProgressChart({ projects }: PMProjectProgressChartProps) {
  const [filter, setFilter] = useState<"all" | "active" | "delayed" | "at_risk" | "completed">("all");

  const filtered = projects.filter((p) => {
    if (filter === "active") return p.statusBadge === "On Track";
    if (filter === "delayed") return p.statusBadge === "Delayed";
    if (filter === "at_risk") return p.statusBadge === "At Risk";
    if (filter === "completed") return p.statusBadge === "Completed";
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Project Progress
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completion rates across active project portfolio
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === "active"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("delayed")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === "delayed"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Delayed
            </button>
            <button
              onClick={() => setFilter("at_risk")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === "at_risk"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              At Risk
            </button>
          </div>
        </div>

        {/* Horizontal Progress Bars */}
        <div className="space-y-4 my-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching projects for this filter.
            </div>
          ) : (
            filtered.map((p) => {
              let barColor = "bg-teal-500";
              if (p.statusBadge === "Delayed") barColor = "bg-red-500";
              else if (p.statusBadge === "At Risk") barColor = "bg-amber-500";
              else if (p.statusBadge === "Completed") barColor = "bg-blue-500";

              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                      {p.projectName}
                    </span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                      {p.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
