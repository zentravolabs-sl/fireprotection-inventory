// ============================================================
// src/app/(Main)/labour-types/loading.tsx
// Loading skeleton state for Labour Types page.
// ============================================================

import LabourTypesTableSkeleton from "./components/LabourTypesTableSkeleton";

export default function LabourTypesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <LabourTypesTableSkeleton />
      </main>
    </div>
  );
}
