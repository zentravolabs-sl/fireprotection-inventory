"use client";

// ============================================================
// src/components/dashboard/project-manager/PMKpiCards.tsx
// 6 Primary Operational KPI Cards for Project Manager.
// ============================================================

import React from "react";
import {
  FolderCheck,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Users,
  Package,
} from "lucide-react";
import { PMKpiCardsData } from "@/lib/services/projectManagerDashboardService";

interface PMKpiCardsProps {
  data: PMKpiCardsData;
}

export function PMKpiCards({ data }: PMKpiCardsProps) {
  const isOverdueZero = data.overdueTasksCount === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ── CARD 1: MY PROJECTS ───────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            My Projects
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FolderCheck size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.myProjectsTotal}
          </p>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
            {data.myProjectsActive} Active
          </p>
        </div>
      </div>

      {/* ── CARD 2: ACTIVE TASKS ──────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Active Tasks
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <CheckSquare size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.activeTasksTotal}
          </p>
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
            {data.activeTasksPctCompleted}% completed
          </p>
        </div>
      </div>

      {/* ── CARD 3: COMPLETED TASKS ───────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Completed Tasks
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.completedTasksTotal}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            +{data.completedTasksThisMonth} this month
          </p>
        </div>
      </div>

      {/* ── CARD 4: OVERDUE TASKS (WARNING STATE) ────────────────────── */}
      <div
        className={`p-5 bg-white dark:bg-gray-900 rounded-2xl border shadow-xs flex flex-col justify-between ${
          isOverdueZero
            ? "border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/20 to-transparent"
            : "border-red-200 dark:border-red-900/60 bg-gradient-to-br from-red-50/20 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isOverdueZero ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
            }`}
          >
            Overdue Tasks
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverdueZero
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
            }`}
          >
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p
            className={`text-2xl sm:text-3xl font-black ${
              isOverdueZero ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
            }`}
          >
            {data.overdueTasksCount}
          </p>
          <p
            className={`text-xs font-semibold mt-1 ${
              isOverdueZero ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {isOverdueZero ? "✓ No overdue tasks" : "Requires attention"}
          </p>
        </div>
      </div>

      {/* ── CARD 5: TEAM MEMBERS ─────────────────────────────────────── */}
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

      {/* ── CARD 6: MATERIAL REQUESTS ────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Material Requests
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Package size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {data.materialRequestsTotal}
          </p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {data.materialRequestsPending} Pending
          </p>
        </div>
      </div>
    </div>
  );
}
