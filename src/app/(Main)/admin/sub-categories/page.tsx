// ============================================================
// src/app/(Main)/admin/sub-categories/page.tsx
// Sub-Category management page — React Server Component.
// Loads categories for the dropdown filter and form.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { getSubCategories } from "./actions";
import { getCategories } from "../categories/actions";
import SubCategoryTable from "./components/SubCategoryTable";
import CategoryFilterSelect from "./components/CategoryFilterSelect";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const metadata = {
  title: "Sub-Categories — CDN Fire Engineering",
  description: "Manage fire protection equipment sub-categories.",
};

interface PageProps {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}

export default async function SubCategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const rawCategoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const categoryId =
    rawCategoryId !== undefined && !isNaN(rawCategoryId) ? rawCategoryId : undefined;

  // Fetch both in parallel
  const [subCategories, categories] = await Promise.all([
    getSubCategories(search, categoryId),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#0F1524]">
      {/* Navigation */}
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
            <span className="font-bold text-[#dce3ef]">Sub-Categories</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#e02424]" />
            <span className="text-sm font-semibold text-[#5a657a] hidden sm:inline">
              CDN Fire Engineering
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Sub-Categories</h1>
            <p className="text-[#5a657a] text-sm mt-1">
              Manage equipment sub-categories nested under their parent categories.
            </p>
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 sm:max-w-sm">
              <SearchInput
                placeholder="Search by name or category…"
                paramKey="search"
                defaultValue={search ?? ""}
              />
            </div>
            <div className="sm:w-56">
              <CategoryFilterSelect
                categories={categories}
                currentCategoryId={categoryId}
              />
            </div>
          </div>
        </div>

        {/* Active filter feedback */}
        {(search || categoryId) && (
          <p className="text-sm text-[#5a657a] mb-4">
            {search && (
              <>
                Showing results for{" "}
                <span className="font-semibold text-[#dce3ef]">&ldquo;{search}&rdquo;</span>
              </>
            )}
            {search && categoryId && " in "}
            {categoryId && (
              <span className="font-semibold text-[#dce3ef]">
                {categories.find((c) => c.id === categoryId)?.categoryName}
              </span>
            )}
            {" — "}
            <Link
              href="/admin/sub-categories"
              className="text-[#e02424] hover:underline font-medium"
            >
              Clear filters
            </Link>
          </p>
        )}

        {/* Table */}
        <Suspense
          fallback={
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Sub-Category Name", "Category", "Created", "Updated", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={6} />
                </tbody>
              </table>
            </div>
          }
        >
          <SubCategoryTable subCategories={subCategories} categories={categories} />
        </Suspense>
      </main>
    </div>
  );
}
