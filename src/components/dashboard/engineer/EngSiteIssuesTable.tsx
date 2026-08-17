"use client";

// ============================================================
// src/components/dashboard/engineer/EngSiteIssuesTable.tsx
// Technical Site Issues & Blockers Reported by Engineer.
// ============================================================

import React from "react";
import Link from "next/link";
import { AlertCircle, PlusCircle, ArrowRight } from "lucide-react";
import { EngSiteIssueItem } from "@/lib/services/engineerDashboardService";

interface EngSiteIssuesTableProps {
  issues: EngSiteIssueItem[];
}

const statusBadgeStyles: Record<string, string> = {
  Open: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800 font-bold",
  "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  Resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  Closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700",
};

export function EngSiteIssuesTable({ issues }: EngSiteIssuesTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Site Issues
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs flex items-center gap-1"
            >
              <PlusCircle size={12} /> Report Issue
            </Link>
            <Link
              href="/projects"
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          On-site installation blockers, material shortages & hazard reports
        </p>

        {issues.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            ✓ No open site issues reported.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((iss) => {
              const badgeClass = statusBadgeStyles[iss.status] || statusBadgeStyles.Open;
              return (
                <div
                  key={iss.id}
                  className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-gray-900 dark:text-gray-100 block">
                      {iss.issueTitle}
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {iss.projectName} • <span className="text-gray-700 dark:text-gray-300 font-medium">{iss.siteLocation}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border block ${badgeClass}`}>
                      {iss.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono block">
                      {iss.reportedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
