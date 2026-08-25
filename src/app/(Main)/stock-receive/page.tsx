// ============================================================
// src/app/(Main)/stock-receive/page.tsx
// Stock Receive list page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import { getStockReceives } from "./actions";
import { getSuppliers } from "@/app/(Main)/suppliers/actions";
import StockReceiveTable from "./components/StockReceiveTable";
import StockReceiveTableSkeleton from "./components/StockReceiveTableSkeleton";
import SearchInput from "@/components/ui/SearchInput";
import type { StockReceiveStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stock Receive â€” CDN Fire Engineering",
  description: "Track Goods Receive Notes (GRN), supplier deliveries, and stock batches.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    supplierId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function StockReceivePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const supplierId = params.supplierId ? parseInt(params.supplierId, 10) : undefined;
  const status = (params.status as StockReceiveStatus) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [supResult, receivesResult] = await Promise.all([
    getSuppliers({ limit: 100 }),
    getStockReceives({ search, supplierId, status, page, limit: 5 }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Goods Receive Notes (GRN)</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Record incoming deliveries from suppliers. Confirming an order automatically generates FIFO batches and IN movements.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search receive no, supplier, ref..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Receive Table */}
        <Suspense fallback={<StockReceiveTableSkeleton />}>
          <StockReceiveTable
            receives={receivesResult.stockReceives}
            total={receivesResult.total}
            page={receivesResult.page}
            limit={receivesResult.limit}
            totalPages={receivesResult.totalPages}
          />
        </Suspense>
      </main>
  );
}
