// ============================================================
// src/app/(Main)/stock-movement/page.tsx
// Stock Movement History Screen â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, History, ShieldCheck } from "lucide-react";
import { getStockMovements } from "./actions";
import StockMovementTable from "./components/StockMovementTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stock Movement History â€” CDN Fire Engineering",
  description: "Immutable stock movement ledger for complete inventory audit trail.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    movementType?: string;
    referenceType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function StockMovementPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const movementType = (params.movementType as any) || undefined;
  const referenceType = (params.referenceType as any) || undefined;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { movements, total, page: currentPage, limit, totalPages } = await getStockMovements({
    search,
    movementType,
    referenceType,
    dateFrom,
    dateTo,
    page,
    limit: 5,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Inventory Movement Ledger</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Immutable audit history of all inventory transactions (IN, OUT, RETURN, TRANSFER, ADJUSTMENT).
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search item code, batch, created by, remarks..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Movement Table */}
        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                    {["#", "Date & Time", "Item", "Batch No", "Movement", "Qty", "Reference Type", "Created By", "Remarks"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={9} />
                </tbody>
              </table>
            </div>
          }
        >
          <StockMovementTable
            movements={movements}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
