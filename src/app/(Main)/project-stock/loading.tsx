import React from "react";
import ProjectStockTableSkeleton from "@/components/projects/ProjectStockTableSkeleton";

export default function ProjectStockLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>

      <ProjectStockTableSkeleton />
    </div>
  );
}

