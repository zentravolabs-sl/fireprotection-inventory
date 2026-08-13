// ============================================================
// src/app/(Main)/categories/loading.tsx
// Streaming skeleton shown by Next.js while the page suspends.
// ============================================================

import TableSkeleton from "@/components/ui/TableSkeleton";

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm h-[65px]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="mb-6">
          <div className="h-10 w-36 bg-red-100 dark:bg-red-950/60 rounded-xl animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                {["#", "Category Name", "Created", "Updated", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableSkeleton rows={6} cols={5} />
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
