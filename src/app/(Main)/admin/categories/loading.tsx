// ============================================================
// src/app/(Main)/admin/categories/loading.tsx
// Streaming skeleton shown by Next.js while the page suspends.
// ============================================================

import TableSkeleton from "@/components/ui/TableSkeleton";

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Nav skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm h-[65px]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-72 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="mb-6">
          <div className="h-10 w-36 bg-red-100 rounded-xl animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#", "Category Name", "Created", "Updated", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
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
