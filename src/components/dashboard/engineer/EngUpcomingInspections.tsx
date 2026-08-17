"use client";

// ============================================================
// src/components/dashboard/engineer/EngUpcomingInspections.tsx
// Technical Inspections Assigned to Engineer.
// ============================================================

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { EngUpcomingInspectionItem } from "@/lib/services/engineerDashboardService";

interface EngUpcomingInspectionsProps {
  inspections: EngUpcomingInspectionItem[];
}

export function EngUpcomingInspections({ inspections }: EngUpcomingInspectionsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Upcoming Inspections
            </h3>
          </div>
          <Link
            href="/projects"
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            View Inspections <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Government & client technical safety compliance audits
        </p>

        {inspections.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No upcoming inspections scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                    {insp.inspectionName}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {insp.projectName} • {insp.siteLocation}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono block">
                    {insp.inspectionDate}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono block">
                    {insp.inspectionTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
