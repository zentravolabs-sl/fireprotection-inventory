// ============================================================
// src/app/(Main)/pipe-cut-pieces/page.tsx
// Pipe Cut Pieces Page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Scissors, ShieldCheck } from "lucide-react";
import { getPipeCutPieces } from "./actions";
import { getInventoryList } from "@/app/(Main)/inventory/actions";
import PipeCutTable from "./components/PipeCutTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";
import type { PipeCutStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pipe & Cut Pieces â€” CDN Fire Engineering",
  description: "Manage remaining pipe off-cuts and batch traceability.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    inventoryId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function PipeCutPiecesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const inventoryId = params.inventoryId ? parseInt(params.inventoryId, 10) : undefined;
  const status = (params.status as PipeCutStatus) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [pipeCutResult, inventoryItems] = await Promise.all([
    getPipeCutPieces({ search, inventoryId, status, page, limit: 5 }),
    getInventoryList(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Pipe Off-Cut Piece Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Track off-cut pipe lengths with full batch traceability to minimize material waste.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search barcode, pipe name, rack..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Table */}
        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                    {["#", "Pipe Item", "Source Batch", "Original Length", "Remaining Length", "Rack", "Barcode", "Status", "Actions"].map(
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
          <PipeCutTable
            cutPieces={pipeCutResult.pipeCutPieces}
            inventoryItems={inventoryItems}
            total={pipeCutResult.total}
            page={pipeCutResult.page}
            limit={pipeCutResult.limit}
            totalPages={pipeCutResult.totalPages}
          />
        </Suspense>
      </main>
  );
}
