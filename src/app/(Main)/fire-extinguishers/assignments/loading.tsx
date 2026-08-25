// ============================================================
// src/app/(Main)/fire-extinguishers/assignments/loading.tsx
// Loading skeleton state for Assignments page.
// ============================================================

import ExtinguisherAssignmentsTableSkeleton from "@/components/fire-extinguishers/ExtinguisherAssignmentsTableSkeleton";

export default function FireExtinguisherAssignmentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <ExtinguisherAssignmentsTableSkeleton />
      </div>
    </div>
  );
}
