// ============================================================
// src/app/(Main)/tools/page.tsx
// Tools management page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, ShieldCheck } from "lucide-react";
import { getTools } from "./actions";
import ToolTable from "./components/ToolTable";
import ToolTableSkeleton from "./components/ToolTableSkeleton";
import ToolFilters from "./components/ToolFilters";
import SearchInput from "@/components/ui/SearchInput";
import type { ToolCondition, ToolStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tools â€” CDN Fire Engineering",
  description: "Manage tools, condition, serial numbers, and equipment status.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    condition?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ToolsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const condition = (params.condition as ToolCondition) || undefined;
  const status = (params.status as ToolStatus) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { tools, total, page: currentPage, limit, totalPages } = await getTools({ search, condition, status, page, limit: 5 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Tools Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Track tool equipment, serial numbers, condition status, and availability.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search code, name, serial number..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <ToolFilters />

        {/* Search Feedback */}
        {search && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing results for{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{search}&rdquo;</span>
            {" â€” "}
            <Link href="/tools" className="text-red-600 dark:text-red-400 hover:underline font-medium">
              Clear Search
            </Link>
          </p>
        )}

        {/* Tools Data Table */}
        <Suspense fallback={<ToolTableSkeleton />}>
          <ToolTable
            tools={tools}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
