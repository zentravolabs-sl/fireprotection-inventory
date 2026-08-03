// ============================================================
// src/app/(Main)/admin/stock-batch/page.tsx
// Read-Only FIFO Stock Batch Screen — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { getStockBatches } from "./actions";
import StockBatchTable from "./components/StockBatchTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const metadata = {
  title: "Stock Batches (FIFO) — CDN Fire Engineering",
  description: "Read-only inventory batch tracking layer for FIFO compliance.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    batchNo?: string;
    warehouse?: string;
    status?: string;
  }>;
}

export default async function StockBatchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const batchNo = params.batchNo?.trim() || undefined;
  const warehouse = params.warehouse?.trim() || undefined;
  const status = (params.status as any) || undefined;

  const batches = await getStockBatches({ search, batchNo, warehouse, status });

  return (
    <div className="min-h-screen bg-[#0F1524]">
      {/* Sticky top navigation */}
      <nav className="bg-[#0F1524] border-b border-[#1e2a3d] shadow-[0_1px_0_0_#1e2a3d,0_4px_24px_rgba(0,0,0,0.45)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a657a] hover:text-[#e02424] transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>
          <span className="text-[#1e2a3d]">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e02424]/10 flex items-center justify-center">
              <Layers size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Stock Batches (FIFO)</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#e02424]" />
            <span className="text-sm font-semibold text-[#5a657a] hidden sm:inline">
              CDN Fire Engineering
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">FIFO Batch Tracking</h1>
            <p className="text-[#5a657a] text-sm mt-1">
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
        <Suspense
          fallback={
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Batch No", "Item", "Received Qty", "Available Qty", "Unit Cost", "Receive Date", "Expiry", "Warehouse", "Rack", "Status"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={11} />
                </tbody>
              </table>
            </div>
          }
        >
          <StockBatchTable batches={batches} />
        </Suspense>
      </main>
    </div>
  );
}
