// ============================================================
// src/components/fire-extinguishers/ExtinguisherUnitDetailsSkeleton.tsx
// Pure Server Component skeleton for Unit Details & Timeline Page.
// ============================================================

export default function ExtinguisherUnitDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Header Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse shrink-0" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-20 max-w-sm w-full bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>

      {/* Grid Specs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 h-20 animate-pulse" />
        ))}
      </div>

      {/* Table Section Skeletons */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="h-6 w-56 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
