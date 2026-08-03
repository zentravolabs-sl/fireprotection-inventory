"use client";

// ============================================================
// src/app/(Main)/admin/stock-movement/components/StockMovementTable.tsx
// Immutable Stock Movement History Table.
// ============================================================

import { History } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { StockMovementRow } from "../actions";

interface StockMovementTableProps {
  movements: StockMovementRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function StockMovementTable({ movements }: StockMovementTableProps) {
  return (
    <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">#</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Date & Time</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Item</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Batch No</th>
              <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Movement</th>
              <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Qty</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Reference Type</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Created By</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a3d]">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                      <History size={24} className="text-[#3d4c62]" />
                    </div>
                    <p className="text-[#5a657a] font-medium text-sm">No stock movement transactions recorded yet.</p>
                    <p className="text-xs text-[#3d4c62]">
                      Stock movements are recorded automatically on stock receives, issues, returns, and cuts.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[#161d2e] transition-colors group">
                  <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#dce3ef] whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-[#dce3ef]">
                    [{row.inventory.itemCode}] {row.inventory.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#e02424] font-semibold">
                    {row.stockBatch.batchNo || `BATCH-#${row.stockBatchId}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={row.movementType} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#dce3ef] tabular-nums">
                    {row.movementType === "OUT" ? `-${row.qty}` : `+${row.qty}`} {row.inventory.unit}
                  </td>
                  <td className="px-4 py-3 text-[#dce3ef]">
                    <span className="font-medium px-2 py-0.5 rounded bg-[#161d2e] border border-[#1e2a3d]">
                      {row.referenceType} {row.referenceId ? `#${row.referenceId}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5a657a] font-medium">{row.createdByUser?.name || "System"}</td>
                  <td className="px-4 py-3 text-[#5a657a] max-w-xs truncate">{row.remarks || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
