"use client";

// ============================================================
// src/components/dashboard/engineer/EngOverdueTasksTable.tsx
// High-priority Warning Section: Overdue Tasks for Engineer.
// ============================================================

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { EngOverdueTaskItem } from "@/lib/services/engineerDashboardService";

interface EngOverdueTasksTableProps {
  tasks: EngOverdueTaskItem[];
}

export function EngOverdueTasksTable({ tasks }: EngOverdueTasksTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 shadow-sm flex flex-col justify-between h-full bg-gradient-to-br from-red-50/10 to-transparent dark:from-red-950/10">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Overdue Tasks
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            {tasks.length} Overdue
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Site technical items past target deadline requiring completion
        </p>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Great! You have no overdue tasks.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 bg-red-50/30 dark:bg-gray-800/50 border border-red-100 dark:border-red-900/40 rounded-xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="font-bold text-xs text-gray-900 dark:text-gray-100 block">
                    {t.taskName}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t.projectName} • <span className="font-mono text-gray-400">Due: {t.dueDate}</span>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 block">
                    {t.daysOverdue} Days Overdue
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
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
