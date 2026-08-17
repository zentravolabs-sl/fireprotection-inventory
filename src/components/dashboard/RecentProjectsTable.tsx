"use client";

// ============================================================
// src/components/dashboard/RecentProjectsTable.tsx
// Table showing recently created/updated projects with "View All Projects" CTA.
// ============================================================

import React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/dateUtils";

interface RecentProjectsTableProps {
  projects: Array<{
    id: number;
    projectCode: string;
    projectName: string;
    status: string;
    projectValue?: number;
    estimatedTotalCost?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    customer?: { companyName?: string; contactPerson?: string } | null;
    projectManager?: { name: string } | null;
    expenses?: Array<{ amount: number }>;
  }>;
}

const statusBadgeStyles: Record<string, string> = {
  IN_PROGRESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  PLANNING: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
};

export function RecentProjectsTable({ projects }: RecentProjectsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Recent Projects Registry
          </h3>
          <Link
            href="/projects"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs"
          >
            View All Projects →
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Latest client contracts, assigned managers, & operational status
        </p>

        {projects.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            No project records found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase text-[11px] font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Project Manager</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Est. Budget</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {projects.map((p) => {
                  const badgeClass = statusBadgeStyles[p.status] || statusBadgeStyles.PLANNING;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-medium">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {p.projectName}
                        </Link>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          {p.projectCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {p.customer?.companyName || p.customer?.contactPerson || "Direct Client"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">
                        {p.projectManager?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-500">
                        {formatDate(p.startDate)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-500">
                        {formatDate(p.endDate)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(p.projectValue || p.estimatedTotalCost || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${badgeClass}`}>
                          {p.status.replace(/_/g, " ")}
                        </span>
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
