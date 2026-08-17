"use client";

// ============================================================
// src/components/dashboard/general-manager/GMKpiCards.tsx
// 6 Executive KPI Cards for the General Manager Dashboard.
// ============================================================

import React from "react";
import {
  FolderCheck,
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Users,
} from "lucide-react";
import { GMKpiCardsData } from "@/lib/services/generalManagerDashboardService";

interface GMKpiCardsProps {
  data: GMKpiCardsData;
}

function formatLKRShort(val: number): string {
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.?0+$/, "");
    return `Rs. ${str}M`;
  }
  if (val >= 1_000) {
    const num = val / 1_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(0);
    return `Rs. ${str}K`;
  }
  return `Rs. ${val.toLocaleString()}`;
}

export function GMKpiCards({ data }: GMKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ── CARD 1: ACTIVE PROJECTS ───────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Active Projects
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FolderCheck size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.activeProjectsCount}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +{data.activeProjectsChangePct}% from last month
          </p>
        </div>
      </div>

      {/* ── CARD 2: OVERALL PROJECT PROGRESS ─────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Overall Progress
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
              {data.overallProgressPct}%
            </p>
            <span className="text-xs text-gray-400 font-medium">Average Completion</span>
          </div>
          {/* Progress Indicator */}
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, data.overallProgressPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 3: TOTAL PROJECT VALUE ─────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Project Value
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatLKRShort(data.totalProjectValue)}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +{data.totalProjectValueChangePct}%
          </p>
        </div>
      </div>

      {/* ── CARD 4: TOTAL EXPENSES ───────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <CreditCard size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatLKRShort(data.totalExpenses)}
          </p>
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
            +{data.totalExpensesChangePct}% from last month
          </p>
        </div>
      </div>

      {/* ── CARD 5: DELAYED PROJECTS (WARNING STATE) ─────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col justify-between bg-gradient-to-br from-amber-50/20 to-transparent dark:from-amber-950/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Delayed Projects
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300">
            {data.delayedProjectsCount}
          </p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {data.delayedProjectsPct}% of active projects
          </p>
        </div>
      </div>

      {/* ── CARD 6: TEAM MEMBERS ─────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Team Members
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.teamMembersTotal}
          </p>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
            {data.teamMembersActive} Active
          </p>
        </div>
      </div>
    </div>
  );
}
