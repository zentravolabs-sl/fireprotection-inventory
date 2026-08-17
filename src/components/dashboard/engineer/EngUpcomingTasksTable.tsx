"use client";

// ============================================================
// src/components/dashboard/engineer/EngUpcomingTasksTable.tsx
// Schedule of Tasks for Upcoming Days.
// ============================================================

import React from "react";
import { Calendar, MapPin } from "lucide-react";
import { EngUpcomingTaskItem } from "@/lib/services/engineerDashboardService";

interface EngUpcomingTasksTableProps {
  tasks: EngUpcomingTaskItem[];
}

const priorityBadgeStyles: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  High: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold",
};

export function EngUpcomingTasksTable({ tasks }: EngUpcomingTasksTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Calendar size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Upcoming Tasks
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Tasks scheduled for execution over the coming days
        </p>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No upcoming tasks scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                      {t.taskName}
                    </span>
                    <span className={`px-2 py-0.2 text-[10px] rounded-md ${priorityBadgeStyles[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{t.projectName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin size={10} /> {t.siteLocation}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block font-mono">
                    {t.scheduledDate}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono block">
                    {t.scheduledTime}
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
