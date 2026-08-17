"use client";

// ============================================================
// src/components/dashboard/general-manager/GMProjectProgressTable.tsx
// Project Progress Section for General Manager.
// Shows Active Projects, Progress %, Client, PM, Status & Due Date.
// ============================================================

import React from "react";
import Link from "next/link";
import { GMProjectProgressItem } from "@/lib/services/generalManagerDashboardService";

interface GMProjectProgressTableProps {
  projects: GMProjectProgressItem[];
}

const statusStyles: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  "At Risk": "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
};

export function GMProjectProgressTable({ projects }: GMProjectProgressTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Project Progress
          </h3>
          <Link
            href="/projects"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
          >
            View All Projects →
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Tracking active projects, completion progress, assigned PMs & due dates
        </p>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No active project progress data recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase text-[11px] font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Project</th>
                  <th className="px-3 py-2.5">Client</th>
                  <th className="px-3 py-2.5">Manager</th>
                  <th className="px-3 py-2.5">Progress</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projects.map((p) => {
                  const badgeClass = statusStyles[p.statusBadge] || statusStyles["On Track"];
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-3 py-3 font-medium">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {p.projectName}
                        </Link>
                        <div className="text-[10px] font-mono text-gray-400">
                          {p.projectCode}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {p.clientName}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {p.pmName}
                      </td>
                      <td className="px-3 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono text-[11px] text-gray-700 dark:text-gray-300 w-8 text-right">
                            {p.progressPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${badgeClass}`}>
                          {p.statusBadge}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-gray-500">
                        {p.dueDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
