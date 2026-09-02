"use client";

// ============================================================
// src/app/(Main)/stock-batch/components/StockBatchTable.tsx
// Read-Only FIFO Stock Batch Table with search & filtering.
// ============================================================

import { useState } from "react";
import { Layers } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import type { StockBatchRow } from "../actions";

interface StockBatchTableProps {
  batches: StockBatchRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function StockBatchTable({
  batches,
  total,
  page,
  limit,
  totalPages,
}: StockBatchTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
        FIFO Stock Batches
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3 whitespace-nowrap">Batch No</th>
              <th className="px-4 py-3 whitespace-nowrap">Item</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Received Qty</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Available Qty</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Unit Cost ($)</th>
              <th className="px-4 py-3 whitespace-nowrap">Receive Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Expiry</th>
              <th className="px-4 py-3 whitespace-nowrap">Warehouse</th>
              <th className="px-4 py-3 whitespace-nowrap">Rack</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <Layers size={28} className="text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No stock batches found.</p>
                    <p className="text-xs text-gray-400">
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
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {row.batchNo || `BATCH-#${row.id}`}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      [{row.inventory.itemCode}] {row.inventory.name}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400 tabular-nums font-medium">
                      {row.receivedQty}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {row.availableQty}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-900 dark:text-gray-100 tabular-nums font-semibold">
                      ${row.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.receiveDate)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.expiryDate)}</td>
                    <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200">{row.warehouse || "Main Warehouse"}</td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{row.rackLocation || "—"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={status} label={statusLabel} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={total}
        limit={limit}
      />
    </div>
  );
}
