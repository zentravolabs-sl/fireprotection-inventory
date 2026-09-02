// ============================================================
// src/components/projects/ProjectDetailsSkeleton.tsx
// Pure Server Component skeleton for Project Details Page.
// ============================================================

import React from "react";

export default function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Header Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            {/* Badges row */}
            <div className="flex items-center space-x-3">
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
            </div>
            {/* Title */}
            <div className="h-8 w-64 md:w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            {/* Subtitle */}
            <div className="h-4 w-72 md:w-[480px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* 6 Financial Metric Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800 space-y-2 animate-pulse"
            >
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700/80 rounded" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700/80 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Navigation Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 md:w-36 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Tab Content Area Skeleton */}
      <div className="space-y-6">
        {/* Specification & Customer cards side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 shadow-sm animate-pulse">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-16 w-full bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 shadow-sm animate-pulse">
            <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-52 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-60 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>

        {/* Financial Breakdown Table Skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="h-5 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">
                    <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700/70 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
