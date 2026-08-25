// ============================================================
// src/app/(Main)/project-stock/loading.tsx
// Loading skeleton state for Project Stock page.
// ============================================================

export default function ProjectStockLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <div className="h-10 w-72 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
