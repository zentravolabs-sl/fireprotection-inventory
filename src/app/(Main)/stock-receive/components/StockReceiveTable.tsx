"use client";

// ============================================================
// src/app/(Main)/stock-receive/components/StockReceiveTable.tsx
// Table view for Goods Receive Notes (GRN) with Status Badges and Actions.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Plus, Eye, CheckCircle2, XCircle, ArrowUpRight, Truck } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { confirmStockReceive, cancelStockReceive, type StockReceiveRow } from "../actions";

interface StockReceiveTableProps {
  receives: StockReceiveRow[];
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
  }).format(new Date(date));
}

export default function StockReceiveTable({
  receives,
  total,
  page,
  limit,
  totalPages,
}: StockReceiveTableProps) {
  const [confirmTarget, setConfirmTarget] = useState<StockReceiveRow | undefined>(undefined);
  const [cancelTarget, setCancelTarget] = useState<StockReceiveRow | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      const res = await confirmStockReceive(confirmTarget.id);
      if (res.success) {
        toast.success(res.message);
        setConfirmTarget(undefined);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsProcessing(true);
    try {
      const res = await cancelStockReceive(cancelTarget.id);
      if (res.success) {
        toast.success(res.message);
        setCancelTarget(undefined);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Goods Receive Notes (GRN)
          </div>
          <Link
            href="/stock-receive/new"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <Plus size={16} />
            <span>Create Goods Receive Note</span>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Receive No</th>
                <th className="px-4 py-3 whitespace-nowrap">Receive Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Supplier</th>
                <th className="px-4 py-3 whitespace-nowrap">Reference No</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Items</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Total Value</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {receives.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Truck size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No goods receive notes found.</p>
                      <Link href="/stock-receive/new" className="text-red-600 dark:text-red-400 text-xs font-semibold hover:underline">
                        Create your first stock receive order
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                receives.map((row, idx) => {
                  const totalValue = row.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{row.receiveNo}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.receiveDate)}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{row.supplier.company}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{row.referenceNo || "—"}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-gray-900 dark:text-gray-100">{row.items.length}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/stock-receive/${row.id}`}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1"
                          title="View / Edit Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </Link>

                        {row.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmTarget(row)}
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md transition-colors inline-flex items-center gap-1"
                              title="Confirm Receive"
                            >
                              <CheckCircle2 size={13} />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelTarget(row)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1"
                              title="Cancel Order"
                            >
                              <XCircle size={13} />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(undefined)}
        onConfirm={handleConfirm}
        title="Confirm Stock Receive"
        description={`Confirming "${confirmTarget?.receiveNo}" will automatically generate Stock Batches and Stock Movements (IN). This action cannot be undone.`}
        confirmText="Confirm Receive"
        variant="info"
        isLoading={isProcessing}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(undefined)}
        onConfirm={handleCancel}
        title="Cancel Stock Receive"
        description={`Are you sure you want to cancel receive order "${cancelTarget?.receiveNo}"?`}
        confirmText="Cancel Receive"
        isLoading={isProcessing}
      />
    </>
  );
}
