// ============================================================
// src/app/(Main)/admin/labour-types/page.tsx
// Labour Types admin page — React Server Component.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, ShieldCheck } from "lucide-react";
import { getLabourTypes } from "./actions";
import LabourTypeTable from "./components/LabourTypeTable";
import TableSkeleton from "@/components/ui/TableSkeleton";

export const metadata = {
  title: "Labour Types — CDN Fire Engineering",
  description: "Manage labour trade types used in workforce planning.",
};

export default async function LabourTypesPage() {
  const labourTypes = await getLabourTypes();

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
              <Tag size={14} className="text-[#e02424]" />
            </div>
            <span className="font-bold text-[#dce3ef]">Labour Types</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#e02424]" />
            <span className="text-sm font-semibold text-[#5a657a] hidden sm:inline">CDN Fire Engineering</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#dce3ef]">Labour Types</h1>
            <p className="text-[#5a657a] text-sm mt-1">
              Define the trade categories for workforce management (e.g. Electrician, Plumber, Welder).
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                    {["#", "Type Name", "Description", "Labours", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">{h}</th>
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
          <LabourTypeTable labourTypes={labourTypes} />
        </Suspense>
      </main>
    </div>
  );
}
