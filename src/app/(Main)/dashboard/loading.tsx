// ============================================================
// src/app/(Main)/dashboard/loading.tsx
// High-density skeleton loading state for the Enterprise Dashboard.
// ============================================================

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>

      {/* 8 KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg mt-3" />
            <div className="h-3 w-36 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Widgets Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" />
        <div className="lg:col-span-7 h-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" />
        <div className="lg:col-span-7 h-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" />
      </div>
    </div>
  );
}
