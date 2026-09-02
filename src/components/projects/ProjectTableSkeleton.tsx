// ============================================================
// src/components/projects/ProjectTableSkeleton.tsx
// Pure Server Component skeleton for Project Management Table.
// ============================================================

import React from "react";

export default function ProjectTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      {/* Controls Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 h-[40px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-[40px] w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56 sm:w-64 h-[40px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-[40px] w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3"><div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3 text-right"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-3.5">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700/70 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="space-y-1.5">
                    <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700/70 rounded" />
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700/70 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700/70 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700/70 rounded" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700/70 rounded-full" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700/70 rounded-md ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="flex items-center space-x-1.5">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
