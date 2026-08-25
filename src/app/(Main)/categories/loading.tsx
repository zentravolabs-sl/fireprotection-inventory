// ============================================================
// src/app/(Main)/categories/loading.tsx
// Streaming skeleton shown by Next.js while the page suspends.
// ============================================================

import CategoryTableSkeleton from "./components/CategoryTableSkeleton";

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm h-[65px]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>

        <CategoryTableSkeleton />
      </main>
    </div>
  );
}
