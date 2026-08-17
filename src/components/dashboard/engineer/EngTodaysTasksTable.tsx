"use client";

// ============================================================
// src/components/dashboard/engineer/EngTodaysTasksTable.tsx
// Primary Action Section: Today's Tasks for Engineer.
// Includes quick task status action toggles ("Start Task", "Complete Task").
// ============================================================

import React, { useState } from "react";
import { Clock, Play, CheckCircle, MapPin } from "lucide-react";
import { EngTodaysTaskItem } from "@/lib/services/engineerDashboardService";

interface EngTodaysTasksTableProps {
  initialTasks: EngTodaysTaskItem[];
}

const priorityBadgeStyles: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  High: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold",
};

export function EngTodaysTasksTable({ initialTasks }: EngTodaysTasksTableProps) {
  const [tasks, setTasks] = useState<EngTodaysTaskItem[]>(initialTasks);

  const handleStartTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "In Progress" } : t))
    );
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "Completed" } : t))
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Clock size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Today's Tasks
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            {tasks.filter((t) => t.status !== "Completed").length} Active Items
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          High-priority site engineering items scheduled for today
        </p>

        {tasks.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            ✓ No tasks scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const isCompleted = t.status === "Completed";
              const isInProgress = t.status === "In Progress";

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30"
                      : isInProgress
                      ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60"
                      : "bg-gray-50/70 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-bold text-xs ${
                          isCompleted
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {t.taskName}
                      </span>
                      <span className={`px-2 py-0.2 text-[10px] rounded-md ${priorityBadgeStyles[t.priority]}`}>
                        {t.priority}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{t.projectName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin size={11} /> {t.siteLocation}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-mono text-gray-500 font-bold">
                      {t.scheduledTime}
                    </span>

                    {/* Interactive Action Buttons */}
                    {t.status === "Pending" && (
                      <button
                        onClick={() => handleStartTask(t.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Play size={11} /> Start Task
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => handleCompleteTask(t.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle size={11} /> Complete Task
                      </button>
                    )}

                    {isCompleted && (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
