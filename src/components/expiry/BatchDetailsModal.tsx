"use client";

// ============================================================
// src/components/expiry/BatchDetailsModal.tsx
// Modal displaying batch details, expiry metrics & full stock movement ledger.
// ============================================================

import React, { useEffect, useState } from "react";
import { X, Calendar, Package, DollarSign, Clock, ShieldAlert, ArrowDownRight, ArrowUpRight, RefreshCw, FileText } from "lucide-react";
import { getBatchExpiryDetailsAction } from "@/app/(Main)/expiry/actions";

interface BatchDetailsModalProps {
  batchId: number | null;
  onClose: () => void;
}

export default function BatchDetailsModal({ batchId, onClose }: BatchDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    let isMounted = true;
    setLoading(true);
    getBatchExpiryDetailsAction(batchId).then((res) => {
      if (isMounted) {
        if (res.success) setData(res.data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [batchId]);

  if (!batchId) return null;

  const formatDate = (d: string | Date | null) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string, daysRemaining: number | null) => {
    if (status === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-red-700 bg-red-100 border border-red-200 rounded-full">
          <ShieldAlert size={13} /> EXPIRED
        </span>
      );
    }
    if (status === "EXPIRING_SOON") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">
          <Clock size={13} /> {daysRemaining !== null ? `${daysRemaining} DAYS REMAINING` : "EXPIRING SOON"}
        </span>
      );
    }
    if (status === "NO_EXPIRY") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-full">
          NO EXPIRY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">
        VALID
      </span>
    );
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <ArrowDownRight size={14} className="text-emerald-500" />;
      case "OUT":
        return <ArrowUpRight size={14} className="text-red-500" />;
      case "RETURN":
        return <RefreshCw size={14} className="text-blue-500" />;
      default:
        return <FileText size={14} className="text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0F1524] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-[#1e2a3d]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 dark:bg-[#161d2e] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {data ? `${data.inventory.name} (${data.batchNo})` : "Loading Batch Details..."}
              </h2>
              <p className="text-xs text-gray-400 dark:text-[#5a657a]">
                Item Code: <span className="font-mono text-gray-200 dark:text-gray-300">{data?.inventory?.itemCode || "--"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-[#1e2a3d] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading || !data ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <RefreshCw size={28} className="animate-spin text-red-600 mb-2" />
              <p className="text-xs font-medium">Fetching batch ledger details...</p>
            </div>
          ) : (
            <>
              {/* Top Banner / Status Card */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#161d2e] dark:to-[#1a233a] rounded-2xl border border-gray-200/80 dark:border-[#1e2a3d] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block mb-1">
                    Current Expiry Status
                  </span>
                  {getStatusBadge(data.status, data.daysRemaining)}
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block mb-0.5">
                    Current Available Stock Value
                  </span>
                  <span className="text-xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
                    LKR {data.stockValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Grid 1: Batch Master Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Supplier
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-[#dce3ef] truncate block mt-0.5">
                    {data.supplier?.company || "N/A"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Receive Date
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-[#dce3ef] block mt-0.5">
                    {formatDate(data.receiveDate)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Manufacture Date
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-[#dce3ef] block mt-0.5">
                    {formatDate(data.manufactureDate)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Expiry Date
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-[#dce3ef] block mt-0.5">
                    {formatDate(data.expiryDate)}
                  </span>
                </div>
              </div>

              {/* Grid 2: Quantities & Costs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Received Qty
                  </span>
                  <span className="text-sm font-black text-gray-900 dark:text-[#dce3ef] tabular-nums mt-0.5 block">
                    {data.receivedQty}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Available Qty
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                    {data.availableQty}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Unit Cost
                  </span>
                  <span className="text-sm font-black text-gray-900 dark:text-[#dce3ef] tabular-nums mt-0.5 block">
                    LKR {data.unitCost.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#161d2e] rounded-xl border border-gray-200/60 dark:border-[#1e2a3d]">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#5a657a] uppercase tracking-wider block">
                    Warehouse / Location
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-[#dce3ef] block mt-0.5 truncate">
                    {data.warehouse || "Main"} — {data.rackLocation || "N/A"}
                  </span>
                </div>
              </div>

              {/* Stock Movement Ledger History */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-[#dce3ef] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-[#1e2a3d] pb-2">
                  <Clock size={14} className="text-red-600 dark:text-red-400" /> Stock Movement History Ledger
                </h3>

                {data.movements && data.movements.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Ref Source</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3">Performed By</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {data.movements.map((m: any) => (
                          <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {formatDate(m.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                              <span className="inline-flex items-center gap-1">
                                {getMovementIcon(m.movementType)} {m.movementType}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-gray-700 dark:text-gray-300">
                              {m.referenceType} #{m.referenceId || "--"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                              {m.movementType === "OUT" ? `-${m.qty}` : `+${m.qty}`}
                            </td>
                            <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200 font-medium">
                              {m.createdBy}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                              {m.remarks || "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic py-3 text-center">No movement history recorded yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#161d2e] border-t border-gray-100 dark:border-[#1e2a3d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-[#1e2a3d] dark:hover:bg-[#253248] transition-all duration-200 text-center whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
