"use client";

// ============================================================
// src/app/(Main)/stock-movement/components/StockMovementTable.tsx
// Immutable Stock Movement History Table.
// ============================================================

import { History } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import type { StockMovementRow } from "../actions";

interface StockMovementTableProps {
  movements: StockMovementRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default function StockMovementTable({
  movements,
  total,
  page,
  limit,
  totalPages,
}: StockMovementTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Stock Movement Audit Log
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
              <th className="px-4 py-3 whitespace-nowrap">Item</th>
              <th className="px-4 py-3 whitespace-nowrap">Batch No</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Movement</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Qty</th>
              <th className="px-4 py-3 whitespace-nowrap">Reference Type</th>
              <th className="px-4 py-3 whitespace-nowrap">Created By</th>
              <th className="px-4 py-3 whitespace-nowrap">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <History size={28} className="text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No stock movement transactions recorded yet.</p>
                    <p className="text-xs text-gray-400">
                      Stock movements are recorded automatically on stock receives, issues, returns, and cuts.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((row, idx) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                    [{row.inventory.itemCode}] {row.inventory.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {row.stockBatch.batchNo || `BATCH-#${row.stockBatchId}`}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={row.movementType} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {row.movementType === "OUT" ? `-${row.qty}` : `+${row.qty}`} {row.inventory.unit}
                  </td>
                  <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200">
                    <span className="font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
                      {row.referenceType} {row.referenceId ? `#${row.referenceId}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{row.createdByUser?.name || "System"}</td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">{row.remarks || "—"}</td>
                </tr>
              ))
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
