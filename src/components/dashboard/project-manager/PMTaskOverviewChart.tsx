"use client";

// ============================================================
// src/components/dashboard/project-manager/PMTaskOverviewChart.tsx
// Task Overview Status Breakdown for Project Manager.
// ============================================================

import React from "react";
import Link from "next/link";
import { CheckSquare, ArrowRight } from "lucide-react";
import { PMTaskOverviewData } from "@/lib/services/projectManagerDashboardService";

interface PMTaskOverviewChartProps {
  data: PMTaskOverviewData;
}

export function PMTaskOverviewChart({ data }: PMTaskOverviewChartProps) {
  const items = [
    { label: "To Do", count: data.toDo, bgClass: "bg-blue-500", borderClass: "border-blue-200 dark:border-blue-900" },
    { label: "In Progress", count: data.inProgress, bgClass: "bg-teal-500", borderClass: "border-teal-200 dark:border-teal-900" },
    { label: "Completed", count: data.completed, bgClass: "bg-emerald-500", borderClass: "border-emerald-200 dark:border-emerald-900" },
    { label: "Overdue", count: data.overdue, bgClass: "bg-red-500", borderClass: "border-red-200 dark:border-red-900" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Task Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Task distribution across assigned field teams
              </p>
            </div>
          </div>
          <Link
            href="/projects"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View All Tasks <ArrowRight size={12} />
          </Link>
        </div>

        {/* Task Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 my-2">
          {items.map((item) => (
            <div
              key={item.label}
              className={`p-3.5 bg-gray-50 dark:bg-gray-800/50 border ${item.borderClass} rounded-xl flex items-center justify-between`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  {item.label}
                </span>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
                  {item.count}
                </p>
              </div>
              <span className={`w-3 h-3 rounded-full ${item.bgClass}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
