"use client";

// ============================================================
// src/components/dashboard/general-manager/GMAtRiskProjectsTable.tsx
// High-priority Management Section: Delayed & At-Risk Projects.
// ============================================================

import React from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { GMAtRiskProjectItem } from "@/lib/services/generalManagerDashboardService";

interface GMAtRiskProjectsTableProps {
  projects: GMAtRiskProjectItem[];
}

export function GMAtRiskProjectsTable({ projects }: GMAtRiskProjectsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 shadow-sm flex flex-col justify-between h-full bg-gradient-to-br from-amber-50/10 to-transparent dark:from-amber-950/10">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Delayed & At-Risk Projects
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {projects.length} Attention Required
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          High-priority executive watchlist for projects experiencing schedule or resource risk
        </p>

        {projects.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            ✓ No delayed or at-risk projects at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/60 dark:bg-gray-800/60 uppercase text-[11px] font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Project</th>
                  <th className="px-3 py-2.5">Manager</th>
                  <th className="px-3 py-2.5">Progress</th>
                  <th className="px-3 py-2.5">Risk Reason</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projects.map((p) => {
                  const isDelayed = p.statusBadge === "Delayed";
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-3 py-3 font-medium">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-gray-900 dark:text-gray-100 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          {p.projectName}
                        </Link>
                        <div className="text-[10px] font-mono text-gray-400">
                          {p.projectCode}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {p.pmName}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                        {p.progressPercent}%
                      </td>
                      <td className="px-3 py-3 text-amber-700 dark:text-amber-400 font-medium">
                        {p.riskReason}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                            isDelayed
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {p.statusBadge}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg transition-colors"
                        >
                          View Project <ExternalLink size={10} />
                        </Link>
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
