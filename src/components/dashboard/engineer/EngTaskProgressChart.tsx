"use client";

// ============================================================
// src/components/dashboard/engineer/EngTaskProgressChart.tsx
// Visual Task Progress Breakdown for Engineer.
// ============================================================

import React from "react";
import { CheckSquare } from "lucide-react";
import { EngTaskProgressData } from "@/lib/services/engineerDashboardService";

interface EngTaskProgressChartProps {
  data: EngTaskProgressData;
}

export function EngTaskProgressChart({ data }: EngTaskProgressChartProps) {
  const items = [
    { label: "Pending", count: data.pending, colorClass: "bg-amber-500", borderClass: "border-amber-200 dark:border-amber-900" },
    { label: "In Progress", count: data.inProgress, colorClass: "bg-teal-500", borderClass: "border-teal-200 dark:border-teal-900" },
    { label: "Completed", count: data.completed, colorClass: "bg-emerald-500", borderClass: "border-emerald-200 dark:border-emerald-900" },
    { label: "Overdue", count: data.overdue, colorClass: "bg-red-500", borderClass: "border-red-200 dark:border-red-900" },
  ];

  const total = data.pending + data.inProgress + data.completed + data.overdue || 1;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <CheckSquare size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            My Task Progress
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Visual status breakdown across all assigned technical tasks
        </p>

        {/* Stacked Bar Representation */}
        <div className="my-3">
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${(data.completed / total) * 100}%` }} />
            <div className="bg-teal-500 h-full" style={{ width: `${(data.inProgress / total) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(data.pending / total) * 100}%` }} />
            <div className="bg-red-500 h-full" style={{ width: `${(data.overdue / total) * 100}%` }} />
          </div>
        </div>

        {/* Task Metric Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {items.map((item) => (
            <div
              key={item.label}
              className={`p-3 bg-gray-50 dark:bg-gray-800/50 border ${item.borderClass} rounded-xl flex items-center justify-between`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  {item.label}
                </span>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
                  {item.count}
                </p>
              </div>
              <span className={`w-3 h-3 rounded-full ${item.colorClass}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
