// ============================================================
// src/app/(Main)/labour-types/page.tsx
// Labour Types admin page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, ShieldCheck } from "lucide-react";
import { getLabourTypes } from "./actions";
import LabourTypeTable from "./components/LabourTypeTable";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Labour Types â€” CDN Fire Engineering",
  description: "Manage labour trade types used in workforce planning.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function LabourTypesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { labourTypes, total, page: currentPage, limit, totalPages } = await getLabourTypes({ page, limit: 5 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Labour Types</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Define the trade categories for workforce management (e.g. Electrician, Plumber, Welder).
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                    {["#", "Type Name", "Description", "Labours", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={5} cols={7} />
                </tbody>
              </table>
            </div>
          }
        >
          <LabourTypeTable
            labourTypes={labourTypes}
            total={total}
            page={currentPage}
            limit={limit}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
  );
}
