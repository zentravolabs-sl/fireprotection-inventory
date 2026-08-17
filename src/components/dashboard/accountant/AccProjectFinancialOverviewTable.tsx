"use client";

// ============================================================
// src/components/dashboard/accountant/AccProjectFinancialOverviewTable.tsx
// Financial performance breakdown per project.
// ============================================================

import React from "react";
import Link from "next/link";
import { ExternalLink, Briefcase } from "lucide-react";
import { ProjectFinancialItem } from "@/lib/services/accountantDashboardService";

interface AccProjectFinancialOverviewTableProps {
  projects: ProjectFinancialItem[];
}

function formatLKR(val: number): string {
  return `Rs. ${val.toLocaleString()}`;
}

export function AccProjectFinancialOverviewTable({ projects }: AccProjectFinancialOverviewTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Project Financial Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cost vs revenue margin analysis by project
              </p>
            </div>
          </div>

          <Link
            href="/reports"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            View Project Finance <ExternalLink size={12} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No project financial data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Project</th>
                  <th className="pb-3 px-4 text-right">Budget</th>
                  <th className="pb-3 px-4 text-right">Actual Cost</th>
                  <th className="pb-3 px-4 text-right">Revenue</th>
                  <th className="pb-3 px-4 text-right">Profit</th>
                  <th className="pb-3 px-4 text-right">Margin</th>
                  <th className="pb-3 pl-4 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {p.projectName}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {p.projectCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                      {formatLKR(p.budget)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-semibold ${
                      p.isOverBudget ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {formatLKR(p.actualCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatLKR(p.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                      {formatLKR(p.profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {p.marginPct}%
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-gray-500">
                      {formatLKR(p.remainingBudget)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
