"use client";

// ============================================================
// src/components/dashboard/project-manager/PMMaterialRequestsTable.tsx
// Project Material Requests Queue for Project Manager.
// ============================================================

import React from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { PMMaterialRequestItem } from "@/lib/services/projectManagerDashboardService";

interface PMMaterialRequestsTableProps {
  requests: PMMaterialRequestItem[];
}

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  Approved: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  Fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
};

export function PMMaterialRequestsTable({ requests }: PMMaterialRequestsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Package size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Material Requests
            </h3>
          </div>
          <Link
            href="/material-requests"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            View Material Requests <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Requisitions submitted for project site materials & equipment
        </p>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No active material requests found.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((mr) => {
              const badgeClass = statusStyles[mr.status] || statusStyles.Pending;
              return (
                <div
                  key={mr.id}
                  className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                        {mr.requestNo}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        ({mr.projectName})
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                      {mr.materialName} × <strong className="font-mono text-gray-900 dark:text-gray-100">{mr.qty} {mr.unit}</strong>
                    </p>
                    <span className="text-[10px] text-gray-400">
                      Req by {mr.requestedBy} • {mr.requestDate}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeClass}`}>
                    {mr.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
