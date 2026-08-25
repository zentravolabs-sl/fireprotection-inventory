// ============================================================
// src/app/(Main)/users-roles/loading.tsx
// Loading skeleton state for User Management page.
// ============================================================

import UserTableSkeleton from "@/components/users/UserTableSkeleton";

export default function UsersRolesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 h-16 animate-pulse" />
          ))}
        </div>

        <UserTableSkeleton />
      </main>
    </div>
  );
}
