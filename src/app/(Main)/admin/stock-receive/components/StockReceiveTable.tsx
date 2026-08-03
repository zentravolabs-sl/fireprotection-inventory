"use client";

// ============================================================
// src/app/(Main)/admin/stock-receive/components/StockReceiveTable.tsx
// Table view for Goods Receive Notes (GRN) with Status Badges and Actions.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Plus, Eye, CheckCircle2, XCircle, ArrowUpRight, Truck } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { confirmStockReceive, cancelStockReceive, type StockReceiveRow } from "../actions";

interface StockReceiveTableProps {
  receives: StockReceiveRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function StockReceiveTable({ receives }: StockReceiveTableProps) {
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/admin/stock-receive/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Create Goods Receive Note
        </Link>
      </div>

      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Receive No</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Receive Date</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Supplier</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Reference No</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Items</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Total Value</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {receives.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Truck size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No goods receive notes found.</p>
                      <Link href="/admin/stock-receive/new" className="text-[#e02424] text-xs font-semibold hover:underline">
                        Create your first stock receive order
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                receives.map((row, idx) => {
                  const totalValue = row.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

                  return (
                    <tr key={row.id} className="hover:bg-[#161d2e] transition-colors group">
                      <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-[#e02424] font-mono whitespace-nowrap">{row.receiveNo}</td>
                      <td className="px-4 py-3 text-[#dce3ef] whitespace-nowrap">{formatDate(row.receiveDate)}</td>
                      <td className="px-4 py-3 font-semibold text-[#dce3ef]">{row.supplier.company}</td>
                      <td className="px-4 py-3 text-[#5a657a]">{row.referenceNo || "—"}</td>
                      <td className="px-4 py-3 text-center text-[#dce3ef] font-semibold">{row.items.length}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#dce3ef] tabular-nums">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/stock-receive/${row.id}`}
                            className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                            title="View / Edit Details"
                          >
                            <Eye size={15} />
                          </Link>

                          {row.status === "DRAFT" && (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmTarget(row)}
                                className="p-1.5 rounded-lg text-[#5a657a] hover:text-emerald-400 hover:bg-emerald-900/30 transition-colors"
                                title="Confirm Receive"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(row)}
                                className="p-1.5 rounded-lg text-[#5a657a] hover:text-rose-400 hover:bg-rose-900/30 transition-colors"
                                title="Cancel Order"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
