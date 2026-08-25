// ============================================================
// src/app/(Main)/reports/components/ReportsSkeleton.tsx
// Pure Server Component skeleton for ERP Reports & Analytics.
// ============================================================

export default function ReportsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>

        {/* 3 Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2 animate-pulse">
              <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700/70 rounded" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Report Table Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
                <th className="px-4 py-3"><div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
                <th className="px-4 py-3 text-right"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
                <th className="px-4 py-3 text-right"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
                <th className="px-4 py-3 text-right"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-36 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                  <td className="px-4 py-3.5 text-right"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                  <td className="px-4 py-3.5 text-right"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                  <td className="px-4 py-3.5 text-right"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
