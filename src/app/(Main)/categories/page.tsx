// ============================================================
// src/app/(Main)/categories/page.tsx
// Category management page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, ShieldCheck } from "lucide-react";
import { getCategories } from "./actions";
import CategoryTable from "./components/CategoryTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories â€” CDN Fire Engineering",
  description: "Manage fire protection equipment categories.",
};

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { categories, total, page: currentPage, limit, totalPages } = await getCategories({ search, page, limit: 5 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Categories</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage equipment and product categories for the inventory.
            </p>
          </div>

          {/* Search */}
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search categoriesâ€¦"
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Search feedback */}
        {search && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing results for{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{search}&rdquo;</span>
            {" â€” "}
            <Link href="/categories" className="text-red-600 dark:text-red-400 hover:underline font-medium">
              Clear
            </Link>
          </p>
        )}

        {/* Table */}
        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                    {["#", "Category Name", "Created", "Updated", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={5} />
                </tbody>
              </table>
            </div>
          }
        >
          <CategoryTable
            categories={categories}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
