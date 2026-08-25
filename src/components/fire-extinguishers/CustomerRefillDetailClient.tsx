"use client";

// ============================================================
// src/components/fire-extinguishers/CustomerRefillDetailClient.tsx
// Customer Refill Detail Page — Full View with Status Actions
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  Box,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  PlayCircle,
  CheckCheck,
  Package,
  Building2,
  User,
  Calendar,
  CalendarClock,
  ChevronRight,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CompleteReturnModal } from "./CompleteReturnModal";
import { CustomerRefillPdfDownloadButton } from "./CustomerRefillPdfDownloadButton";
import {
  startCustomerRefillAction,
  markCustomerRefillReadyAction,
} from "@/app/actions/customer-refills";
import { formatDate } from "@/lib/dateUtils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RefillStatus = "DRAFT" | "RECEIVED" | "IN_PROGRESS" | "READY_TO_RETURN" | "COMPLETED" | "CANCELLED";

interface CustomerRefillData {
  refill: {
    id: number;
    refillNo: string;
    status: RefillStatus;
    receivedDate: string;
    completedDate: string | null;
    notes: string | null;
    customer: {
      id: number;
      companyName: string;
      contactPerson: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
    };
    createdBy: { id: string; name: string; email: string } | null;
    items: {
      id: number;
      extinguisherType: string;
      capacity: string | null;
      receivedQty: number;
      returnedQty: number;
      notes: string | null;
      refillDate: string | null;
      expireDate: string | null;
    }[];
    replacements: {
      id: number;
      inventoryId: number;
      issuedQty: number;
      returnedQty: number;
      status: string;
      issuedDate: string;
      returnedDate: string | null;
      notes: string | null;
      inventory: { id: number; itemCode: string; name: string; unit: string };
    }[];
  };
  stockMovements: {
    id: number;
    movementType: "IN" | "OUT";
    qty: number;
    referenceType: string;
    remarks: string | null;
    createdAt: string;
    inventory: { itemCode: string; name: string; unit: string };
    createdByUser: { id: string; name: string } | null;
  }[];
}

const STATUS_CONFIG: Record<RefillStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: "Draft", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  RECEIVED: { label: "Received", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-400", dot: "bg-amber-500" },
  READY_TO_RETURN: { label: "Ready to Return", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-400", dot: "bg-purple-500" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: RefillStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

interface Props {
  data: CustomerRefillData;
  userPermissions: string[];
}

export function CustomerRefillDetailClient({ data: initialData, userPermissions }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const { refill, stockMovements } = data;

  const canStart = userPermissions.includes("customerRefills.startRefill");
  const canEdit = userPermissions.includes("customerRefills.edit");
  const canComplete = userPermissions.includes("customerRefills.complete");

  const handleStart = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await startCustomerRefillAction(refill.id);
      if (res.success && res.data) {
        setData((prev) => ({ ...prev, refill: { ...prev.refill, status: "IN_PROGRESS" } }));
      } else {
        setActionError(res.message ?? "Failed to start refill.");
      }
    });
  };

  const handleMarkReady = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await markCustomerRefillReadyAction(refill.id);
      if (res.success && res.data) {
        setData((prev) => ({ ...prev, refill: { ...prev.refill, status: "READY_TO_RETURN" } }));
      } else {
        setActionError(res.message ?? "Failed to mark as ready.");
      }
    });
  };

  const onReturnSuccess = () => {
    router.refresh();
  };

  // Summary
  const totalReceived = refill.items.reduce((s, i) => s + i.receivedQty, 0);
  const totalReturned = refill.items.reduce((s, i) => s + i.returnedQty, 0);
  const totalReplIssued = refill.replacements.reduce((s, r) => s + r.issuedQty, 0);
  const totalReplReturned = refill.replacements.reduce((s, r) => s + r.returnedQty, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back */}
      <Link
        href="/fire-extinguishers/customer-refills"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customer Refills
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shrink-0">
              <Flame size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black font-mono text-gray-900 dark:text-gray-100 tracking-tight">
                  {refill.refillNo}
                </h1>
                <StatusBadge status={refill.status} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {refill.customer.companyName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Received: {formatDate(refill.receivedDate)}
                </span>
                {refill.completedDate && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle size={12} />
                    Completed: {formatDate(refill.completedDate)}
                  </span>
                )}
                {refill.createdBy && (
                  <span className="flex items-center gap-1">
                    <User size={12} /> {refill.createdBy.name}
                  </span>
                )}
              </div>
              {refill.notes && (
                <p className="mt-2 text-xs text-gray-500 italic">"{refill.notes}"</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href={`/fire-extinguishers/customer-refills/${refill.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Printer size={15} /> Print
            </Link>

            <CustomerRefillPdfDownloadButton
              refillId={refill.id}
              refillNo={refill.refillNo}
              variant="secondary"
            />

            {(refill.status === "RECEIVED" || refill.status === "DRAFT") && canStart && (
              <button
                onClick={handleStart}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <PlayCircle size={15} /> Start Refill
              </button>
            )}

            {refill.status === "IN_PROGRESS" && canEdit && (
              <button
                onClick={handleMarkReady}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCheck size={15} /> Mark Ready
              </button>
            )}

            {(refill.status === "READY_TO_RETURN" || refill.status === "IN_PROGRESS") && canComplete && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
              >
                <Package size={15} /> Process Return
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" /> {actionError}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Items Received", value: totalReceived, icon: <Flame size={18} />, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Items Returned", value: totalReturned, icon: <CheckCircle size={18} />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Replacements Issued", value: totalReplIssued, icon: <TrendingDown size={18} />, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Replacements Returned", value: totalReplReturned, icon: <TrendingUp size={18} />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className={`mb-2 ${color}`}>{icon}</div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Building2 size={14} className="text-blue-600" /> Customer Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-400 font-semibold mb-0.5">Company</div>
            <div className="font-bold text-gray-900 dark:text-gray-100">{refill.customer.companyName}</div>
          </div>
          {refill.customer.contactPerson && (
            <div>
              <div className="text-gray-400 font-semibold mb-0.5">Contact</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{refill.customer.contactPerson}</div>
            </div>
          )}
          {refill.customer.phone && (
            <div>
              <div className="text-gray-400 font-semibold mb-0.5">Phone</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{refill.customer.phone}</div>
            </div>
          )}
          {refill.customer.email && (
            <div>
              <div className="text-gray-400 font-semibold mb-0.5">Email</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{refill.customer.email}</div>
            </div>
          )}
          {refill.customer.address && (
            <div className="col-span-2">
              <div className="text-gray-400 font-semibold mb-0.5">Address</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{refill.customer.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* Customer's Extinguishers */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Flame size={14} className="text-red-600" /> Customer's Fire Extinguishers
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-500">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Extinguisher Type</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3 text-center">Received</th>
                <th className="py-2.5 px-3 text-center">Returned</th>
                <th className="py-2.5 px-3 text-center">Pending</th>
                <th className="py-2.5 px-3">Refill Date</th>
                <th className="py-2.5 px-3">Expire Date</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {refill.items.map((item, idx) => {
                const pending = item.receivedQty - item.returnedQty;

                // Compute expiry urgency
                let expireBadge: React.ReactNode = null;
                if (item.expireDate) {
                  const daysLeft = Math.floor(
                    (new Date(item.expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  if (daysLeft < 0) {
                    expireBadge = (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                        EXPIRED
                      </span>
                    );
                  } else if (daysLeft <= 30) {
                    expireBadge = (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        daysLeft <= 7
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {daysLeft}d
                      </span>
                    );
                  }
                }

                return (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{item.extinguisherType}</td>
                    <td className="py-2.5 px-3 text-gray-500">{item.capacity ?? "—"}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{item.receivedQty}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600">{item.returnedQty}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold ${
                          pending === 0 ? "text-emerald-500" : "text-red-600"
                        }`}
                      >
                        {pending}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {item.refillDate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Calendar size={11} />
                          {formatDate(item.refillDate)}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.expireDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={11} className="text-red-600" />
                          <span className="text-red-700 dark:text-red-400">{formatDate(item.expireDate)}</span>
                          {expireBadge}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 italic">{item.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temporary Replacements */}
      {refill.replacements.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Box size={14} className="text-purple-600" /> Temporary Replacements (Our Warehouse)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-purple-200 dark:border-purple-900/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-50/60 dark:bg-purple-950/20 text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-center">Issued</th>
                  <th className="py-2.5 px-3 text-center">Returned</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Issued Date</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30">
                {refill.replacements.map((repl) => (
                  <tr key={repl.id}>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{repl.inventory.name}</div>
                      <div className="text-[10px] font-mono text-gray-400">{repl.inventory.itemCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {repl.issuedQty} {repl.inventory.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600">{repl.returnedQty}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          repl.status === "RETURNED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : repl.status === "PARTIALLY_RETURNED"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}
                      >
                        {repl.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{formatDate(repl.issuedDate)}</td>
                    <td className="py-2.5 px-3 text-gray-400 italic">{repl.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Movement History */}
      {stockMovements.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-500" /> Stock Movement History
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stockMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 text-gray-500 font-mono">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.movementType === "OUT"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}
                      >
                        {m.movementType === "OUT" ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{m.inventory.name}</div>
                      <div className="text-[10px] font-mono text-gray-400">{m.inventory.itemCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {m.qty} {m.inventory.unit}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 italic">{m.remarks ?? "—"}</td>
                    <td className="py-2.5 px-3 text-gray-500">{m.createdByUser?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <CompleteReturnModal
          refillId={refill.id}
          refillNo={refill.refillNo}
          items={refill.items}
          replacements={refill.replacements}
          onClose={() => setShowReturnModal(false)}
          onSuccess={onReturnSuccess}
        />
      )}
    </div>
  );
}
