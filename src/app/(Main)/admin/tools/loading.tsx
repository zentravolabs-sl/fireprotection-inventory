// ============================================================
// src/app/(Main)/admin/tools/loading.tsx
// Loading skeleton state for Tools page.
// ============================================================

import TableSkeleton from "@/components/ui/TableSkeleton";

export default function ToolsLoading() {
  return (
    <div className="min-h-screen bg-[#080c12]">
      <div className="bg-[#0d1117] border-b border-[#1e2a3d] h-16 animate-pulse" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#161d2e] rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-[#161d2e] rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full sm:w-80 bg-[#161d2e] rounded-xl animate-pulse" />
        </div>

        <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] p-4 mb-6 h-20 animate-pulse" />

        <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                {["#", "Tool Code", "Tool Name", "Serial Number", "Condition", "Status", "Created Date", "Actions"].map((h) => (
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
      </main>
    </div>
  );
}
