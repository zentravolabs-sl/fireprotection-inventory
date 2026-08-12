"use client";

// ============================================================
// src/components/transfers/TransferDetailModal.tsx
// Modal for viewing complete details & lifecycle actions of a transfer
// ============================================================

import React, { useState } from "react";
import {
  submitProjectTransferAction,
  approveProjectTransferAction,
  completeProjectTransferAction,
  cancelProjectTransferAction,
} from "@/app/actions/transfers";
import { formatDate, formatCurrency } from "@/lib/dateUtils";

interface TransferDetailModalProps {
  transfer: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  currentUserRole?: string;
}

export function TransferDetailModal({
  transfer,
  isOpen,
  onClose,
  onRefresh,
  currentUserRole = "ADMIN",
}: TransferDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !transfer) return null;

  async function handleAction(
    actionFn: (id: number) => Promise<{ success: boolean; message: string }>
  ) {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await actionFn(transfer.id);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      if (onRefresh) onRefresh();
    } else {
      setError(res.message);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "DRAFT":
        return "bg-gray-800 text-gray-300 border-gray-700";
      case "PENDING":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "APPROVED":
        return "bg-blue-950 text-blue-300 border-blue-800";
      case "COMPLETED":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "CANCELLED":
        return "bg-red-950 text-red-300 border-red-800";
      default:
        return "bg-gray-800 text-gray-300 border-gray-700";
    }
  }

  const totalValue =
    transfer.totalValue ||
    (transfer.items || []).reduce(
      (sum: number, item: any) => sum + (item.qty || 0) * (item.unitCost || 0),
      0
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-extrabold text-red-500 bg-red-950/50 px-2.5 py-0.5 rounded border border-red-800/60">
                {transfer.transferNo}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(
                  transfer.status
                )}`}
              >
                {transfer.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Project to Project Stock Transfer Document
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl font-bold p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* Transfer Route Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                FROM PROJECT (Source)
              </span>
              <span className="text-sm font-bold text-gray-100 block">
                {transfer.fromProject?.projectCode} — {transfer.fromProject?.projectName}
              </span>
              <span className="text-gray-400 text-[11px]">
                Location: {transfer.fromProject?.location || "N/A"}
              </span>
            </div>

            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                TO PROJECT (Destination)
              </span>
              <span className="text-sm font-bold text-gray-100 block">
                {transfer.toProject?.projectCode} — {transfer.toProject?.projectName}
              </span>
              <span className="text-gray-400 text-[11px]">
                Location: {transfer.toProject?.location || "N/A"}
              </span>
            </div>
          </div>

          {/* Audit / People Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-950/40 border border-gray-800/60 rounded-lg text-gray-300">
            <div>
              <span className="text-gray-500 block">Transfer Date</span>
              <span className="font-semibold text-gray-200">
                {formatDate(transfer.transferDate)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Requested By</span>
              <span className="font-semibold text-gray-200">
                {transfer.requestedBy?.name || "System"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Approved By</span>
              <span className="font-semibold text-gray-200">
                {transfer.approvedBy?.name || "Pending / N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Total Items</span>
              <span className="font-bold text-red-400 text-sm">
                {(transfer.items || []).length} Item(s)
              </span>
            </div>
          </div>

          {/* Remarks */}
          {transfer.remarks && (
            <div className="p-3 bg-gray-950/50 border border-gray-800 rounded-lg">
              <span className="text-gray-400 font-semibold block mb-1">Remarks / Note:</span>
              <p className="text-gray-200">{transfer.remarks}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-200 text-sm">Transfer Line Items</h3>
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-gray-950 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Item Type</th>
                    <th className="px-4 py-3">Item Name / Code</th>
                    <th className="px-4 py-3">Batch / Reference</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Cost</th>
                    <th className="px-4 py-3 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                  {(transfer.items || []).map((item: any) => {
                    let typeLabel = "MATERIAL";
                    let itemName = item.inventory?.name || "N/A";
                    let itemCode = item.inventory?.itemCode || "";
                    let batchLabel = item.stockBatch?.batchNo || `Batch #${item.stockBatchId || "-"}`;

                    if (item.pipeCutPiece) {
                      typeLabel = "PIPE_CUT";
                      itemName = `Pipe Cut Piece (${item.pipeCutPiece.pieceLength} ${item.pipeCutPiece.unit})`;
                      itemCode = item.pipeCutPiece.barcode || `#${item.pipeCutPiece.id}`;
                      batchLabel = `Cut Piece #${item.pipeCutPiece.id}`;
                    } else if (item.tool) {
                      typeLabel = "TOOL";
                      itemName = item.tool.name;
                      itemCode = item.tool.toolCode;
                      batchLabel = `S/N: ${item.tool.serialNo || "N/A"}`;
                    }

                    return (
                      <tr key={item.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              typeLabel === "MATERIAL"
                                ? "bg-teal-950 text-teal-300 border border-teal-800"
                                : typeLabel === "PIPE_CUT"
                                ? "bg-blue-950 text-blue-300 border border-blue-800"
                                : "bg-purple-950 text-purple-300 border border-purple-800"
                            }`}
                          >
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-100">
                          {itemName}
                          <div className="text-[11px] text-gray-400 font-mono">{itemCode}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400">{batchLabel}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-100">
                          {item.qty} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {formatCurrency(item.unitCost || 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          {formatCurrency((item.qty || 0) * (item.unitCost || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-950 font-bold text-gray-100 border-t border-gray-800">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase">
                      Total Transfer Value:
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950 flex flex-wrap justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
          >
            Close
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            {transfer.status === "DRAFT" && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleAction(submitProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  Submit for Approval
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction(cancelProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-red-300 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  Cancel Transfer
                </button>
              </>
            )}

            {transfer.status === "PENDING" && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleAction(approveProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  Approve Transfer
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction(cancelProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-red-300 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  Cancel Transfer
                </button>
              </>
            )}

            {transfer.status === "APPROVED" && (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleAction(completeProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  ✓ Complete Transfer & Update Stock
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction(cancelProjectTransferAction)}
                  className="py-3 px-5 text-sm font-semibold text-red-300 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-xl transition-all duration-200 disabled:opacity-60"
                >
                  Cancel Transfer
                </button>
              </>
            )}

            {transfer.status === "COMPLETED" && (
              <span className="px-4 py-2.5 rounded-xl font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs">
                ✓ Transfer Completed & Locked
              </span>
            )}

            {transfer.status === "CANCELLED" && (
              <span className="px-4 py-2.5 rounded-xl font-bold bg-red-950 text-red-300 border border-red-800 text-xs">
                ✕ Transfer Cancelled
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
