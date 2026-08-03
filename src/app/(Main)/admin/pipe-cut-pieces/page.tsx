// ============================================================
// src/app/(Main)/admin/pipe-cut-pieces/page.tsx
// Pipe Cut Pieces Page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Scissors, ShieldCheck } from "lucide-react";
import { getPipeCutPieces } from "./actions";
import { getInventoryList } from "@/app/(Main)/admin/inventory/actions";
import PipeCutTable from "./components/PipeCutTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";
import type { PipeCutStatus } from "@/generated/prisma/client";

export const metadata = {
  title: "Pipe & Cut Pieces — CDN Fire Engineering",
  description: "Manage remaining pipe off-cuts and batch traceability.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    inventoryId?: string;
    status?: string;
  }>;
}

export default async function PipeCutPiecesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const inventoryId = params.inventoryId ? parseInt(params.inventoryId, 10) : undefined;
  const status = (params.status as PipeCutStatus) || undefined;

  const [cutPieces, inventoryItems] = await Promise.all([
    getPipeCutPieces({ search, inventoryId, status }),
    getInventoryList(),
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
              <Scissors size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Pipe Cut Pieces</span>
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Pipe Off-Cut Piece Management</h1>
            <p className="text-[#5a657a] text-sm mt-1">
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
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Pipe Item", "Source Batch", "Original Length", "Remaining Length", "Rack", "Barcode", "Status", "Actions"].map(
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
          <PipeCutTable cutPieces={cutPieces} inventoryItems={inventoryItems} />
        </Suspense>
      </main>
    </div>
  );
}
