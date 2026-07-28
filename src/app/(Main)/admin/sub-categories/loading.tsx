// ============================================================
// src/app/(Main)/admin/sub-categories/loading.tsx
// Streaming skeleton for sub-categories page.
// ============================================================

import TableSkeleton from "@/components/ui/TableSkeleton";

export default function SubCategoriesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Nav skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm h-[65px]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 flex-1 max-w-sm bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-10 w-56 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Button skeleton */}
        <div className="mb-6">
          <div className="h-10 w-44 bg-red-100 rounded-xl animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#", "Sub-Category Name", "Category", "Created", "Updated", "Actions"].map((h) => (
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
              <TableSkeleton rows={6} cols={6} />
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
