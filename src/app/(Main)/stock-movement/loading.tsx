// ============================================================
// src/app/(Main)/stock-movement/loading.tsx
// Loading skeleton state for Stock Movement page.
// ============================================================

import StockMovementTableSkeleton from "./components/StockMovementTableSkeleton";

export default function StockMovementLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-80 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
        <StockMovementTableSkeleton />
      </main>
    </div>
  );
}
