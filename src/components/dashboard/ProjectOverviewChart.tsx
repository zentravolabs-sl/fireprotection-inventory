"use client";

// ============================================================
// src/components/dashboard/ProjectOverviewChart.tsx
// Responsive SVG Donut Chart showing Project Status Breakdown.
// Vertically centered inside the card to avoid large gaps.
// ============================================================

import React from "react";
import { ProjectStatusSummary } from "@/lib/services/dashboardService";

interface ProjectOverviewChartProps {
  summary: ProjectStatusSummary;
}

export function ProjectOverviewChart({ summary }: ProjectOverviewChartProps) {
  const total = summary.active + summary.completed + summary.pending + summary.delayed;

  const data = [
    { label: "Active", value: summary.active, color: "#10b981", bgClass: "bg-emerald-500" },
    { label: "Completed", value: summary.completed, color: "#3b82f6", bgClass: "bg-blue-500" },
    { label: "Pending", value: summary.pending, color: "#f59e0b", bgClass: "bg-amber-500" },
    { label: "Delayed", value: summary.delayed, color: "#ef4444", bgClass: "bg-red-500" },
  ];

  // SVG Donut Path calculations
  let cumulativePercent = 0;

  const slices = data.map((item) => {
    const percent = total > 0 ? item.value / total : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    const startAngle = startPercent * 360;
    const endAngle = cumulativePercent * 360;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const radius = 40;
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData =
      total === 0 || percent === 0
        ? ""
        : percent === 1
        ? "M 50,10 A 40,40 0 1,1 49.99,10 Z"
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return {
      ...item,
      pathData,
      percent: Math.round(percent * 100),
    };
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col h-full">
      {/* Title Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Project Overview
          </h3>
          <span className="text-xs text-gray-400 font-medium">{total} Total Projects</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Distribution across active, completed, and pending statuses
        </p>
      </div>

      {/* SVG Donut & Legend Grid Centered Vertically */}
      <div className="flex-1 flex items-center justify-center my-auto py-4">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="12"
                className="dark:stroke-gray-800"
              />
              {slices.map(
                (slice, i) =>
                  slice.pathData && (
                    <path
                      key={i}
                      d={slice.pathData}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    />
                  )
              )}
            </svg>
            {/* Inner Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
                {summary.active}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                Active Projects
              </span>
            </div>
          </div>

          {/* Legend Summary */}
          <div className="space-y-3">
            {slices.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${item.bgClass}`} />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {item.value}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    ({item.percent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
