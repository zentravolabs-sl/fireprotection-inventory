"use client";

// ============================================================
// src/app/(Main)/admin/stock-batch/components/StockBatchTable.tsx
// Read-Only FIFO Stock Batch Table with search & filtering.
// ============================================================

import { useState } from "react";
import { Layers } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { StockBatchRow } from "../actions";

interface StockBatchTableProps {
  batches: StockBatchRow[];
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function StockBatchTable({ batches }: StockBatchTableProps) {
  return (
    <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">#</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Batch No</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Item</th>
              <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Received Qty</th>
              <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Available Qty</th>
              <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Unit Cost ($)</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Receive Date</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Expiry</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Warehouse</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Rack</th>
              <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a3d]">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                      <Layers size={24} className="text-[#3d4c62]" />
                    </div>
                    <p className="text-[#5a657a] font-medium text-sm">No stock batches found.</p>
                    <p className="text-xs text-[#3d4c62]">
                      Batches are created automatically when Goods Receive orders are confirmed.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              batches.map((row, idx) => {
                let status: "AVAILABLE" | "SCRAPPED" = row.availableQty > 0 ? "AVAILABLE" : "SCRAPPED";
                let statusLabel = row.availableQty > 0 ? "Available" : "Exhausted";

                return (
                  <tr key={row.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-[#e02424] font-mono whitespace-nowrap">
                      {row.batchNo || `BATCH-#${row.id}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#dce3ef]">
                      [{row.inventory.itemCode}] {row.inventory.name}
                    </td>
                    <td className="px-4 py-3 text-right text-[#5a657a] tabular-nums font-medium">
                      {row.receivedQty} {row.inventory.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#dce3ef] tabular-nums">
                      {row.availableQty} {row.inventory.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-[#dce3ef] tabular-nums font-semibold">
                      ${row.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#dce3ef] whitespace-nowrap">{formatDate(row.receiveDate)}</td>
                    <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">{formatDate(row.expiryDate)}</td>
                    <td className="px-4 py-3 text-[#dce3ef]">{row.warehouse || "Main Warehouse"}</td>
                    <td className="px-4 py-3 text-[#5a657a]">{row.rackLocation || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={status} label={statusLabel} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
