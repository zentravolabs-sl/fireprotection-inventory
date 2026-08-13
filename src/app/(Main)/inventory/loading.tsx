// ============================================================
// src/app/(Main)/inventory/loading.tsx
// Loading skeleton state for Inventory page.
// ============================================================

import TableSkeleton from "@/components/ui/TableSkeleton";

export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 animate-pulse" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-80 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 h-24 animate-pulse" />

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                {["#", "Item Code", "Image", "Name", "Category", "Sub Category", "Brand", "Unit", "Current Stock", "Min Stock", "Buy Price", "Sell Price", "Supplier", "Warehouse", "Rack", "Location", "Expiry", "Barcode", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <TableSkeleton rows={5} cols={19} />
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
