"use client";

// ============================================================
// src/components/dashboard/project-manager/PMTeamWorkloadWidget.tsx
// Engineer & Team Workload Distribution Widget.
// ============================================================

import React from "react";
import { Users } from "lucide-react";
import { PMTeamWorkloadItem } from "@/lib/services/projectManagerDashboardService";

interface PMTeamWorkloadWidgetProps {
  engineers: PMTeamWorkloadItem[];
}

const statusPillStyles: Record<string, string> = {
  Available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  Normal: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  Busy: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  Overloaded: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800 font-bold",
};

export function PMTeamWorkloadWidget({ engineers }: PMTeamWorkloadWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Team Workload
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Assigned task capacity and availability per engineer
        </p>

        <div className="space-y-4 my-2">
          {engineers.map((eng) => {
            const statusClass = statusPillStyles[eng.workloadStatus] || statusPillStyles.Normal;
            let barColor = "bg-blue-500";
            if (eng.workloadStatus === "Overloaded") barColor = "bg-red-500";
            else if (eng.workloadStatus === "Busy") barColor = "bg-amber-500";
            else if (eng.workloadStatus === "Available") barColor = "bg-emerald-500";

            return (
              <div
                key={eng.id}
                className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {eng.engineerName}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusClass}`}>
                    {eng.workloadStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{eng.assignedTasks} Tasks ({eng.completedTasks} Done, {eng.activeTasks} Active)</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{eng.workloadPct}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${eng.workloadPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
