"use client";

// ============================================================
// src/components/dashboard/general-manager/GMManagementSummary.tsx
// Executive Management Summary Card.
// Renders dynamic, real-time bullet statements generated from database data.
// ============================================================

import React from "react";
import { FileText, Sparkles } from "lucide-react";
import { GMManagementSummaryData } from "@/lib/services/generalManagerDashboardService";

interface GMManagementSummaryProps {
  summary: GMManagementSummaryData;
}

export function GMManagementSummary({ summary }: GMManagementSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Sparkles size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Management Summary
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Automated executive summary generated from live operational database records
        </p>

        <ul className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-gray-900 dark:text-gray-100">{summary.activeProjectsCount} active projects</strong> are currently in progress.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
            <span>
              Overall project completion across portfolio is <strong className="font-bold text-gray-900 dark:text-gray-100">{summary.overallProgressPct}%</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-amber-700 dark:text-amber-400">{summary.attentionRequiredCount} projects</strong> require immediate management attention.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <span>
              Current project portfolio value stands at <strong className="font-bold text-gray-900 dark:text-gray-100">{summary.portfolioValueFormatted}</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-red-600 dark:text-red-400">{summary.overBudgetCount} projects</strong> are currently running over contract budget.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span>
              <strong className="font-bold text-purple-700 dark:text-purple-400">{summary.pendingApprovalsCount} approvals</strong> are waiting for management action.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
