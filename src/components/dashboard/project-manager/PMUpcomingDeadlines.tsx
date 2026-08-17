"use client";

// ============================================================
// src/components/dashboard/project-manager/PMUpcomingDeadlines.tsx
// Upcoming Key Deadlines & Milestone Countdown for Project Manager.
// ============================================================

import React from "react";
import { Calendar, Clock } from "lucide-react";
import { PMUpcomingDeadlineItem } from "@/lib/services/projectManagerDashboardService";

interface PMUpcomingDeadlinesProps {
  deadlines: PMUpcomingDeadlineItem[];
}

export function PMUpcomingDeadlines({ deadlines }: PMUpcomingDeadlinesProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Calendar size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Upcoming Deadlines
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Milestones, government inspections & delivery commitments
        </p>

        {deadlines.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No upcoming deadlines recorded.
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                    {d.title}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 inline-block">
                    {d.type} • Due: {d.dueDate}
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs flex items-center gap-1 shrink-0">
                  <Clock size={12} /> {d.daysRemaining} days left
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
