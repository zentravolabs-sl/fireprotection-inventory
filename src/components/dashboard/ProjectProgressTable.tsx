"use client";

// ============================================================
// src/components/dashboard/ProjectProgressTable.tsx
// Table component displaying top active project progress & statuses.
// ============================================================

import React from "react";
import Link from "next/link";
import { ProjectProgressItem } from "@/lib/services/dashboardService";

interface ProjectProgressTableProps {
  projects: ProjectProgressItem[];
}

const statusBadgeStyles: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  "At Risk": "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  Delayed: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
};

export function ProjectProgressTable({ projects }: ProjectProgressTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Project Progress Overview
          </h3>
          <Link
            href="/projects"
            className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline"
          >
            View All →
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Tracking key active projects, progress percentages, & completion dates
        </p>

        {projects.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            No active project progress recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase text-[11px] font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Project</th>
                  <th className="px-3 py-2.5">Client</th>
                  <th className="px-3 py-2.5">Manager</th>
                  <th className="px-3 py-2.5 text-center">Progress</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projects.map((p) => {
                  const badgeClass = statusBadgeStyles[p.statusBadge] || statusBadgeStyles["On Track"];
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-3 py-3">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {p.projectName}
                        </Link>
                        <div className="text-[10px] font-mono text-gray-400">{p.projectCode}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{p.clientName}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{p.pmName}</td>
                      <td className="px-3 py-3">
                        <div className="w-28 mx-auto">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                            <span>{p.progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.progressPercent >= 80
                                  ? "bg-emerald-500"
                                  : p.progressPercent >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${badgeClass}`}>
                          {p.statusBadge}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-gray-500">{p.dueDate}</td>
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
