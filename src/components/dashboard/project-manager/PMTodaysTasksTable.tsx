"use client";

// ============================================================
// src/components/dashboard/project-manager/PMTodaysTasksTable.tsx
// High-priority Tasks Due Today for Project Manager.
// ============================================================

import React from "react";
import { Clock, CheckSquare } from "lucide-react";
import { PMTodaysTaskItem } from "@/lib/services/projectManagerDashboardService";

interface PMTodaysTasksTableProps {
  tasks: PMTodaysTaskItem[];
}

const priorityBadgeStyles: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  High: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold",
};

export function PMTodaysTasksTable({ tasks }: PMTodaysTasksTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Today's Tasks
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Field execution items scheduled for completion today
        </p>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            ✓ No tasks scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-colors group cursor-pointer"
              >
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t.taskName}
                    </span>
                    <span className={`px-2 py-0.2 text-[10px] rounded-md ${priorityBadgeStyles[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{t.projectName}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t.assignedEngineer}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block font-bold">
                    {t.dueTime}
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
