// ============================================================
// src/app/(Main)/fire-extinguishers/[unitCode]/loading.tsx
// Loading skeleton state for Fire Extinguisher Unit Details page.
// ============================================================

import ExtinguisherUnitDetailsSkeleton from "@/components/fire-extinguishers/ExtinguisherUnitDetailsSkeleton";

export default function UnitDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <ExtinguisherUnitDetailsSkeleton />
      </div>
    </div>
  );
}
