"use client";

// ============================================================
// src/components/dashboard/project-manager/PMProjectActivities.tsx
// Audit Timeline of Recent Project Activities.
// ============================================================

import React from "react";
import { Activity, Clock } from "lucide-react";
import { PMActivityItem } from "@/lib/services/projectManagerDashboardService";

interface PMProjectActivitiesProps {
  activities: PMActivityItem[];
}

export function PMProjectActivities({ activities }: PMProjectActivitiesProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <Activity size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Recent Project Activities
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Real-time log of field execution events, material requests & progress updates
        </p>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No recent project activities recorded.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-900" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {act.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      by {act.userName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock size={10} /> {act.timeAgo}
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
