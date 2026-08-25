"use client";

// ============================================================
// src/components/projects/ProjectMaterialSummaryTab.tsx
// Tab displaying project-wide material lifecycle metrics
// ============================================================

import React, { useEffect, useState } from "react";
import { getProjectMaterialSummariesAction } from "@/app/actions/project-estimates";

interface ProjectMaterialSummaryTabProps {
  projectId: number;
  materialRequestsCount: number;
}

export function ProjectMaterialSummaryTab({
  projectId,
  materialRequestsCount,
}: ProjectMaterialSummaryTabProps) {
  const [loading, setLoading] = useState(true);
  const [summaryRows, setSummaryRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError(null);
      const res = await getProjectMaterialSummariesAction(projectId);
      setLoading(false);

      if (res.success && res.data) {
        setSummaryRows(res.data);
      } else {
        setError(res.message || "Failed to load material summary");
      }
    }

    loadSummary();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        Loading project material summary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
        {error}
      </div>
    );
  }

  // Summary Metrics
  const totalEstimatedItems = summaryRows.filter((r) => r.totalEstimatedQty > 0).length;
  const totalIssuedCount = summaryRows.filter((r) => r.totalIssuedQty > 0).length;
  const totalReturnedCount = summaryRows.filter((r) => r.totalReturnedQty > 0).length;

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Estimated Items
          </span>
          <span className="text-xl font-black text-blue-950 dark:text-blue-100">
            {totalEstimatedItems} <span className="text-xs font-normal">materials</span>
          </span>
        </div>

        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Material Requests
          </span>
          <span className="text-xl font-black text-amber-950 dark:text-amber-100">
            {materialRequestsCount} <span className="text-xs font-normal">requests</span>
          </span>
        </div>

        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900">
          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
            Issued Materials
          </span>
          <span className="text-xl font-black text-teal-950 dark:text-teal-100">
            {totalIssuedCount} <span className="text-xs font-normal">items</span>
          </span>
        </div>

        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Returned Materials
          </span>
          <span className="text-xl font-black text-indigo-950 dark:text-indigo-100">
            {totalReturnedCount} <span className="text-xs font-normal">items</span>
          </span>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📊 Project Material Summary Ledger
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Complete project-wide comparison of total estimated, requested, issued, and returned quantities
          </p>
        </div>

        {summaryRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No material estimates or material transactions recorded for this project yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px] text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3">Material Item</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Total Estimated</th>
                  <th className="px-4 py-3 text-right">Total Requested</th>
                  <th className="px-4 py-3 text-right">Total Issued</th>
                  <th className="px-4 py-3 text-right">Total Returned</th>
                  <th className="px-4 py-3 text-right">Remaining To Request</th>
                  <th className="px-4 py-3 text-right">Remaining To Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {summaryRows.map((row) => (
                  <tr key={row.inventoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 mr-2">
                        {row.itemCode}
                      </span>
                      {row.name}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                      {row.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-blue-600 dark:text-blue-400">
                      {row.totalEstimatedQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {row.totalRequestedQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-teal-600 dark:text-teal-400">
                      {row.totalIssuedQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-purple-600 dark:text-purple-400">
                      {row.totalReturnedQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.remainingToRequest.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                      {row.remainingToIssue.toLocaleString()}
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
