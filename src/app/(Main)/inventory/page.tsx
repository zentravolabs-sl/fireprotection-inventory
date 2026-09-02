// ============================================================
// src/app/(Main)/inventory/page.tsx
// Inventory Master page React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Package, ShieldCheck } from "lucide-react";
import { getInventory } from "./actions";
import { getCategories } from "@/app/(Main)/categories/actions";
import InventoryTable from "./components/InventoryTable";
import InventoryTableSkeleton from "./components/InventoryTableSkeleton";
import InventoryFilters from "./components/InventoryFilters";
import SearchInput from "@/components/ui/SearchInput";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory Master CDN Fire Engineering",
  description: "Manage fire protection inventory master catalogue and minimum stock rules.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    subCategoryId?: string;
    warehouse?: string;
    stockStatus?: string;
    page?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const categoryId = params.categoryId ? parseInt(params.categoryId, 10) : undefined;
  const subCategoryId = params.subCategoryId ? parseInt(params.subCategoryId, 10) : undefined;
  const warehouse = params.warehouse?.trim() || undefined;
  const stockStatus = (params.stockStatus as any) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [catResult, inventoryResult] = await Promise.all([
    getCategories({ limit: 100 }),
    getInventory({
      search,
      categoryId,
      subCategoryId,
      warehouse,
      stockStatus,
      page,
      limit: 5,
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Inventory Master Catalogue</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Master item definitions. Stock levels are calculated automatically from Stock Batches.
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
        <InventoryFilters categories={catResult.categories} />

        {/* Search Feedback */}
        {search && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing results for{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{search}&rdquo;</span>
            {" â€” "}
            <Link href="/inventory" className="text-red-600 dark:text-red-400 hover:underline font-medium">
              Clear Search
            </Link>
          </p>
        )}

        {/* Inventory Data Table */}
        <Suspense fallback={<InventoryTableSkeleton />}>
          <InventoryTable
            inventories={inventoryResult.items}
            categories={catResult.categories}
            total={inventoryResult.total}
            page={inventoryResult.page}
            limit={inventoryResult.limit}
            totalPages={inventoryResult.totalPages}
          />
        </Suspense>
      </main>
  );
}
