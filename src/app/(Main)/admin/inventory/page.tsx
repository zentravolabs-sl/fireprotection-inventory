// ============================================================
// src/app/(Main)/admin/inventory/page.tsx
// Inventory management page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Package, ShieldCheck } from "lucide-react";
import { getInventory } from "./actions";
import { getCategories } from "@/app/(Main)/admin/categories/actions";
import { getSuppliers } from "@/app/(Main)/admin/suppliers/actions";
import InventoryTable from "./components/InventoryTable";
import InventoryFilters from "./components/InventoryFilters";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";
import type { IssueLocation } from "@/generated/prisma/client";

export const metadata = {
  title: "Inventory — CDN Fire Engineering",
  description: "Manage fire protection inventory, stock levels, and equipment.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    subCategoryId?: string;
    supplierId?: string;
    issueLocation?: string;
    stockStatus?: string;
    expiryStatus?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const categoryId = params.categoryId ? parseInt(params.categoryId, 10) : undefined;
  const subCategoryId = params.subCategoryId ? parseInt(params.subCategoryId, 10) : undefined;
  const supplierId = params.supplierId ? parseInt(params.supplierId, 10) : undefined;
  const issueLocation = (params.issueLocation as IssueLocation) || undefined;
  const stockStatus = (params.stockStatus as any) || undefined;
  const expiryStatus = (params.expiryStatus as any) || undefined;

  // Fetch categories, suppliers, and filtered inventory concurrently
  const [categories, suppliers, inventories] = await Promise.all([
    getCategories(),
    getSuppliers(),
    getInventory({
      search,
      categoryId,
      subCategoryId,
      supplierId,
      issueLocation,
      stockStatus,
      expiryStatus,
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#080c12]">
      {/* Sticky top navigation */}
      <nav className="bg-[#0d1117] border-b border-[#1e2a3d] shadow-[0_1px_0_0_#1e2a3d,0_4px_24px_rgba(0,0,0,0.45)] sticky top-0 z-10">
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
              <Package size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Inventory</span>
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Inventory Management</h1>
            <p className="text-[#5a657a] text-sm mt-1">
              Track fire protection stock, locations, suppliers, and expiration status.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search code, name, barcode, brand..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <InventoryFilters categories={categories} suppliers={suppliers} />

        {/* Search Feedback */}
        {search && (
          <p className="text-sm text-[#5a657a] mb-4">
            Showing results for{" "}
            <span className="font-semibold text-[#dce3ef]">&ldquo;{search}&rdquo;</span>
            {" — "}
            <Link href="/admin/inventory" className="text-[#e02424] hover:underline font-medium">
              Clear Search
            </Link>
          </p>
        )}

        {/* Inventory Data Table */}
        <Suspense
          fallback={
            <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                    {["#", "Item Code", "Image", "Name", "Category", "Sub Category", "Brand", "Unit", "Current Stock", "Min Stock", "Buy Price", "Sell Price", "Supplier", "Warehouse", "Rack", "Location", "Expiry", "Barcode", "Actions"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">
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
          }
        >
          <InventoryTable inventories={inventories} categories={categories} />
        </Suspense>
      </main>
    </div>
  );
}
