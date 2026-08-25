// ============================================================
// src/app/(Main)/reports/loading.tsx
// Streaming skeleton for Fire Protection ERP Reports Page.
// ============================================================

import ReportsSkeleton from "./components/ReportsSkeleton";

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ReportsSkeleton />
    </div>
  );
}
