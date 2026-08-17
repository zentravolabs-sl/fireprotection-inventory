"use client";

// ============================================================
// src/components/dashboard/engineer/EngTodaysSummary.tsx
// Engineer Daily Workload Summary Card.
// ============================================================

import React from "react";
import { Sparkles } from "lucide-react";
import { EngTodaysSummaryData } from "@/lib/services/engineerDashboardService";

interface EngTodaysSummaryProps {
  summary: EngTodaysSummaryData;
}

export function EngTodaysSummary({ summary }: EngTodaysSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Sparkles size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Today's Summary
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Overview of daily site schedule, progress & requisitions
        </p>

        <ul className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-gray-900 dark:text-gray-100">{summary.tasksScheduled} Tasks Scheduled</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-emerald-600 dark:text-emerald-400">{summary.tasksCompleted} Tasks Completed</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-blue-600 dark:text-blue-400">{summary.tasksInProgress} Tasks In Progress</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-amber-600 dark:text-amber-400">{summary.tasksPending} Task Pending</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-indigo-600 dark:text-indigo-400">{summary.siteVisitsCount} Site Visits Scheduled</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-purple-600 dark:text-purple-400">{summary.inspectionsCount} Technical Inspection</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-amber-600 dark:text-amber-400">{summary.pendingMRCount} Material Request Pending</strong>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
