// ============================================================
// src/app/(Main)/sub-categories/page.tsx
// Sub-Category management page â€” React Server Component.
// Loads categories for the dropdown filter and form.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { getSubCategories } from "./actions";
import { getCategories } from "../categories/actions";
import SubCategoryTable from "./components/SubCategoryTable";
import SubCategoryTableSkeleton from "./components/SubCategoryTableSkeleton";
import CategoryFilterSelect from "./components/CategoryFilterSelect";
import SearchInput from "@/components/ui/SearchInput";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sub-Categories â€” CDN Fire Engineering",
  description: "Manage fire protection equipment sub-categories.",
};

interface PageProps {
  searchParams: Promise<{ search?: string; categoryId?: string; page?: string }>;
}

export default async function SubCategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const rawCategoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const categoryId =
    rawCategoryId !== undefined && !isNaN(rawCategoryId) ? rawCategoryId : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  // Fetch both in parallel
  const [subCatResult, categoriesResult] = await Promise.all([
    getSubCategories({ search, categoryId, page, limit: 5 }),
    getCategories({ limit: 100 }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Sub-Categories</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage equipment sub-categories nested under their parent categories.
            </p>
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 sm:max-w-sm">
              <SearchInput
                placeholder="Search by name or categoryâ€¦"
                paramKey="search"
                defaultValue={search ?? ""}
              />
            </div>
            <div className="sm:w-56">
              <CategoryFilterSelect
                categories={categoriesResult.categories}
                currentCategoryId={categoryId}
              />
            </div>
          </div>
        </div>

        {/* Active filter feedback */}
        {(search || categoryId) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {search && (
              <>
                Showing results for{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{search}&rdquo;</span>
              </>
            )}
            {search && categoryId && " in "}
            {categoryId && (
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {categoriesResult.categories.find((c) => c.id === categoryId)?.categoryName}
              </span>
            )}
            {" â€” "}
            <Link
              href="/sub-categories"
              className="text-red-600 hover:underline font-medium"
            >
              Clear filters
            </Link>
          </p>
        )}

        {/* Table */}
        <Suspense fallback={<SubCategoryTableSkeleton />}>
          <SubCategoryTable
            subCategories={subCatResult.subCategories}
            categories={categoriesResult.categories}
            total={subCatResult.total}
            page={subCatResult.page}
            limit={subCatResult.limit}
            totalPages={subCatResult.totalPages}
          />
        </Suspense>
      </main>
  );
}
