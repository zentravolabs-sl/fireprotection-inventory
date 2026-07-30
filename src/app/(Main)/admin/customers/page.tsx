// ============================================================
// src/app/(Main)/admin/customers/page.tsx
// Customers management page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { getCustomers } from "./actions";
import CustomerTable from "./components/CustomerTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const metadata = {
  title: "Customers — CDN Fire Engineering",
  description: "Manage client companies, contact details, and customer accounts.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;

  const customers = await getCustomers(search);

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
              <Users size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Customers</span>
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Customers Management</h1>
            <p className="text-[#5a657a] text-sm mt-1">
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
          <p className="text-sm text-[#5a657a] mb-4">
            Showing results for{" "}
            <span className="font-semibold text-[#dce3ef]">&ldquo;{search}&rdquo;</span>
            {" — "}
            <Link href="/admin/customers" className="text-[#e02424] hover:underline font-medium">
              Clear Search
            </Link>
          </p>
        )}

        {/* Customer Data Table */}
        <Suspense
          fallback={
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Company Name", "Contact Person", "Phone", "Email", "Address", "Created Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={8} />
                </tbody>
              </table>
            </div>
          }
        >
          <CustomerTable customers={customers} />
        </Suspense>
      </main>
    </div>
  );
}
