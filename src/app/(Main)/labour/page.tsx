// ============================================================
// src/app/(Main)/labour/page.tsx
// Labour Master admin page â€” React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, HardHat, ShieldCheck } from "lucide-react";
import { getLabours, getActiveLabourTypes } from "./actions";
import LabourTable from "./components/LabourTable";
import LabourMasterTableSkeleton from "./components/LabourMasterTableSkeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Labour Master â€” CDN Fire Engineering",
  description: "Register and manage workers across all projects.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    typeId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function LabourMasterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const labourTypeId = params.typeId ? Number(params.typeId) : undefined;
  const isActive = params.status === "inactive" ? false : params.status === "active" ? true : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [labourResult, labourTypes] = await Promise.all([
    getLabours({ search, labourTypeId, isActive, page, limit: 5 }),
    getActiveLabourTypes(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Labour Master</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Register and manage your workforce â€” {labourResult.total} record{labourResult.total !== 1 ? "s" : ""} total.
            </p>
          </div>
        </div>

        <Suspense fallback={<LabourMasterTableSkeleton />}>
          <LabourTable
            labours={labourResult.labours}
            labourTypes={labourTypes}
            total={labourResult.total}
            page={labourResult.page}
            limit={labourResult.limit}
            totalPages={labourResult.totalPages}
          />
        </Suspense>
      </main>
  );
}
