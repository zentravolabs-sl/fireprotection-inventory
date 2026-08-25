// ============================================================
// src/app/(Main)/stock-batch/components/StockBatchTableSkeleton.tsx
// Pure Server Component skeleton for FIFO Stock Batch Table.
// ============================================================

export default function StockBatchTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 w-10"><div className="h-3.5 w-4 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3 text-right"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
              <th className="px-4 py-3 text-right"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
              <th className="px-4 py-3 text-right"><div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse ml-auto" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-14 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3"><div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse" /></th>
              <th className="px-4 py-3 text-center"><div className="h-3.5 w-14 bg-gray-200 dark:bg-gray-700/80 rounded animate-pulse mx-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-3.5"><div className="h-4 w-5 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-36 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5 text-right"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                <td className="px-4 py-3.5 text-right"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                <td className="px-4 py-3.5 text-right"><div className="h-4 w-14 bg-gray-200 dark:bg-gray-700/70 rounded ml-auto" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700/70 rounded" /></td>
                <td className="px-4 py-3.5 text-center"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700/70 rounded-full mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
