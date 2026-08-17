"use client";

// ============================================================
// src/components/dashboard/project-manager/PMProjectSummary.tsx
// Project Manager Operational Summary Card.
// Renders dynamic, real-time summary sentences generated from database queries.
// ============================================================

import React from "react";
import { Sparkles } from "lucide-react";
import { PMProjectSummaryData } from "@/lib/services/projectManagerDashboardService";

interface PMProjectSummaryProps {
  summary: PMProjectSummaryData;
}

export function PMProjectSummary({ summary }: PMProjectSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Project Summary
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Real-time operational summary computed from live project records
        </p>

        <ul className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <span>
              You currently manage <strong className="font-bold text-gray-900 dark:text-gray-100">{summary.activeProjectsCount} active projects</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-emerald-600 dark:text-emerald-400">{summary.onTrackCount} projects</strong> are on track.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-amber-600 dark:text-amber-400">{summary.atRiskCount} project(s)</strong> are at risk.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-red-600 dark:text-red-400">{summary.delayedCount} project(s)</strong> are delayed.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-red-600 dark:text-red-400">{summary.overdueTasksCount} tasks</strong> are overdue.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-amber-600 dark:text-amber-400">{summary.pendingMaterialRequestsCount} material requests</strong> are currently pending.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-indigo-600 dark:text-indigo-400">{summary.overloadedEngineersCount} engineers</strong> are currently overloaded.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
