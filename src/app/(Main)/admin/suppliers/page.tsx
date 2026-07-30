// ============================================================
// src/app/(Main)/admin/suppliers/page.tsx
// Supplier management page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { getSuppliers } from "./actions";
import SupplierTable from "./components/SupplierTable";
import SearchInput from "@/components/ui/SearchInput";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const metadata = {
  title: "Suppliers — CDN Fire Engineering",
  description: "Manage equipment suppliers and vendors.",
};

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;

  const suppliers = await getSuppliers(search);

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
              <Building2 size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Suppliers</span>
          </div>

          {/* Breadcrumb right side */}
          <div className="ml-auto flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#e02424]" />
            <span className="text-sm font-semibold text-[#5a657a] hidden sm:inline">
              CDN Fire Engineering
            </span>
          </div>
        </div>
      </nav>

      {/* Main content container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Suppliers</h1>
            <p className="text-[#5a657a] text-sm mt-1">
              Manage product vendors, contact details, and supplier records.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search by company, contact, email..."
              paramKey="search"
              defaultValue={search ?? ""}
            />
          </div>
        </div>

        {/* Search feedback */}
        {search && (
          <p className="text-sm text-[#5a657a] mb-4">
            Showing results for{" "}
            <span className="font-semibold text-[#dce3ef]">&ldquo;{search}&rdquo;</span>
            {" — "}
            <Link href="/admin/suppliers" className="text-[#e02424] hover:underline font-medium">
              Clear
            </Link>
          </p>
        )}

        {/* Table with suspense skeleton fallback */}
        <Suspense
          fallback={
            <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F1524] border-b border-[#1e2a3d]">
                    {["#", "Company", "Contact Person", "Phone", "Email", "Address", "Created", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={8} />
                </tbody>
              </table>
            </div>
          }
        >
          <SupplierTable suppliers={suppliers} />
        </Suspense>
      </main>
    </div>
  );
}
