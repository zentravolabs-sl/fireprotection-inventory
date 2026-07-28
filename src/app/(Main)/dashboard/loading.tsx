// ============================================================
// src/app/(Main)/dashboard/loading.tsx
// Suspense loading skeleton for the dashboard.
// ============================================================

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse">
      {/* Navbar skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="h-9 w-72 bg-gray-200 rounded-xl mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-32 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
