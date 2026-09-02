import React from "react";
import MaterialRequestsTableSkeleton from "@/components/projects/MaterialRequestsTableSkeleton";

export default function MaterialRequestsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>

      <MaterialRequestsTableSkeleton />
    </div>
  );
}

