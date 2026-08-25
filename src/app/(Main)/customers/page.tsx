// ============================================================
// src/app/(Main)/customers/page.tsx
// Customers management page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { getCustomers } from "./actions";
import CustomerTable from "./components/CustomerTable";
import CustomerTableSkeleton from "./components/CustomerTableSkeleton";
import SearchInput from "@/components/ui/SearchInput";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customers â€” CDN Fire Engineering",
  description: "Manage client companies, contact details, and customer accounts.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { customers, total, page: currentPage, limit, totalPages } = await getCustomers({ search, page, limit: 5 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Customers Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage client companies, contact persons, phone numbers, and email accounts.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search company, contact, phone, email..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Search Feedback */}
        {search && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing results for{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{search}&rdquo;</span>
            {" â€” "}
            <Link href="/customers" className="text-red-600 dark:text-red-400 hover:underline font-medium">
              Clear Search
            </Link>
          </p>
        )}

        {/* Customer Data Table */}
        <Suspense fallback={<CustomerTableSkeleton />}>
          <CustomerTable
            customers={customers}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
