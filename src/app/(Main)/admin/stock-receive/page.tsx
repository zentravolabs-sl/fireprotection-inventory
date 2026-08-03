// ============================================================
// src/app/(Main)/admin/stock-receive/page.tsx
// Stock Receive list page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import { getStockReceives } from "./actions";
import { getSuppliers } from "@/app/(Main)/admin/suppliers/actions";
import StockReceiveTable from "./components/StockReceiveTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";
import type { StockReceiveStatus } from "@/generated/prisma/client";

export const metadata = {
  title: "Stock Receive — CDN Fire Engineering",
  description: "Track Goods Receive Notes (GRN), supplier deliveries, and stock batches.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    supplierId?: string;
    status?: string;
  }>;
}

export default async function StockReceivePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const supplierId = params.supplierId ? parseInt(params.supplierId, 10) : undefined;
  const status = (params.status as StockReceiveStatus) || undefined;

  const [suppliers, receives] = await Promise.all([
    getSuppliers(),
    getStockReceives({ search, supplierId, status }),
  ]);

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
              <Truck size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Stock Receive</span>
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Goods Receive Notes (GRN)</h1>
            <p className="text-[#5a657a] text-sm mt-1">
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
        <Suspense
          fallback={
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Receive No", "Receive Date", "Supplier", "Reference No", "Items", "Total Value", "Status", "Actions"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">
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
          <StockReceiveTable receives={receives} />
        </Suspense>
      </main>
    </div>
  );
}
