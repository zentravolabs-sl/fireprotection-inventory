// ============================================================
// src/app/(Main)/stock-batch/page.tsx
// Read-Only FIFO Stock Batch Screen â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { getStockBatches } from "./actions";
import StockBatchTable from "./components/StockBatchTable";
import StockBatchTableSkeleton from "./components/StockBatchTableSkeleton";
import SearchInput from "@/components/ui/SearchInput";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stock Batches (FIFO) â€” CDN Fire Engineering",
  description: "Read-only inventory batch tracking layer for FIFO compliance.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    batchNo?: string;
    warehouse?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function StockBatchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const batchNo = params.batchNo?.trim() || undefined;
  const warehouse = params.warehouse?.trim() || undefined;
  const status = (params.status as any) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { batches, total, page: currentPage, limit, totalPages } = await getStockBatches({ search, batchNo, warehouse, status, page, limit: 5 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">FIFO Batch Tracking</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Read-only batch ledger sorted by receipt date to ensure First-In-First-Out material consumption.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search batch no, item name, code..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Batch Table */}
        <Suspense fallback={<StockBatchTableSkeleton />}>
          <StockBatchTable
            batches={batches}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
