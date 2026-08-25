"use client";

// ============================================================
// src/components/fire-extinguishers/CompleteReturnModal.tsx
// Complete Return Modal — Customer Refill Return Processing
// ============================================================

import React, { useState, useTransition } from "react";
import {
  X,
  ArrowLeft,
  PackageCheck,
  Flame,
  Box,
  AlertCircle,
  Calendar,
  CalendarClock,
} from "lucide-react";
import { completeCustomerRefillReturnAction } from "@/app/actions/customer-refills";

interface RefillItem {
  id: number;
  extinguisherType: string;
  capacity: string | null;
  receivedQty: number;
  returnedQty: number;
}

interface Replacement {
  id: number;
  inventoryId: number;
  issuedQty: number;
  returnedQty: number;
  status: string;
  inventory: { itemCode: string; name: string; unit: string };
}

interface Props {
  refillId: number;
  refillNo: string;
  items: RefillItem[];
  replacements: Replacement[];
  onClose: () => void;
  onSuccess: () => void;
}

// Helper — today as yyyy-mm-dd for default refill date
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CompleteReturnModal({ refillId, refillNo, items, replacements, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Customer-owned items (track how many are being returned now)
  const [itemReturns, setItemReturns] = useState<Record<number, number>>(
    Object.fromEntries(
      items.map((item) => [item.id, Math.max(0, item.receivedQty - item.returnedQty)])
    )
  );

  // Refill dates per item
  const [itemRefillDates, setItemRefillDates] = useState<Record<number, string>>(
    Object.fromEntries(items.map((item) => [item.id, todayStr()]))
  );

  // Expire dates per item
  const [itemExpireDates, setItemExpireDates] = useState<Record<number, string>>(
    Object.fromEntries(items.map((item) => [item.id, ""]))
  );

  // Temp replacements (track how many are being returned now)
  const [replReturns, setReplReturns] = useState<Record<number, number>>(
    Object.fromEntries(
      replacements
        .filter((r) => r.status !== "RETURNED")
        .map((r) => [r.id, Math.max(0, r.issuedQty - r.returnedQty)])
    )
  );

  const pendingItems = items.filter((i) => i.returnedQty < i.receivedQty);
  const pendingRepls = replacements.filter((r) => r.returnedQty < r.issuedQty);

  // Compute expire warning for display
  function getExpireWarning(expireDate: string): { level: "ok" | "warn" | "danger" | "expired"; daysLeft: number } | null {
    if (!expireDate) return null;
    const exp = new Date(expireDate);
    const now = new Date();
    const diff = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { level: "expired", daysLeft: diff };
    if (diff <= 7) return { level: "danger", daysLeft: diff };
    if (diff <= 30) return { level: "warn", daysLeft: diff };
    return { level: "ok", daysLeft: diff };
  }

  const submit = () => {
    setError(null);

    // Validate
    for (const item of pendingItems) {
      const qty = itemReturns[item.id] ?? 0;
      const max = item.receivedQty - item.returnedQty;
      if (qty < 0 || qty > max) {
        setError(`Return qty for '${item.extinguisherType}' cannot exceed ${max}.`);
        return;
      }
    }
    for (const repl of pendingRepls) {
      const qty = replReturns[repl.id] ?? 0;
      const max = repl.issuedQty - repl.returnedQty;
      if (qty < 0 || qty > max) {
        setError(`Return qty for '${repl.inventory.name}' cannot exceed ${max}.`);
        return;
      }
    }

    startTransition(async () => {
      const result = await completeCustomerRefillReturnAction({
        refillId,
        returnedItems: pendingItems.map((i) => ({
          itemId: i.id,
          returnQty: itemReturns[i.id] ?? 0,
          refillDate: itemRefillDates[i.id] || null,
          expireDate: itemExpireDates[i.id] || null,
        })),
        returnedReplacements: pendingRepls.map((r) => ({
          replacementId: r.id,
          returnQty: replReturns[r.id] ?? 0,
        })),
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message ?? "An error occurred.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-600">
              <PackageCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">Process Return</h2>
              <p className="text-[11px] text-gray-400 font-mono">{refillNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* Customer's extinguishers */}
          {pendingItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="text-red-600" size={15} />
                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                  Customer's Extinguishers (Return to Customer)
                </h3>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase text-gray-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Extinguisher Type</th>
                      <th className="py-2.5 px-3 text-center">Received</th>
                      <th className="py-2.5 px-3 text-center">Already Returned</th>
                      <th className="py-2.5 px-3 text-center">Returning Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingItems.map((item) => {
                      const maxReturn = item.receivedQty - item.returnedQty;
                      const expWarn = getExpireWarning(itemExpireDates[item.id] ?? "");
                      return (
                        <React.Fragment key={item.id}>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">
                              {item.extinguisherType}
                              {item.capacity && <span className="text-gray-400 ml-1">({item.capacity})</span>}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{item.receivedQty}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-gray-400">{item.returnedQty}</td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxReturn}
                                value={itemReturns[item.id] ?? 0}
                                onChange={(e) =>
                                  setItemReturns((p) => ({ ...p, [item.id]: Number(e.target.value) }))
                                }
                                className="w-20 text-center px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="text-gray-400 ml-1.5">/ {maxReturn}</span>
                            </td>
                          </tr>
                          {/* Date row */}
                          <tr className="bg-red-50/30 dark:bg-red-950/20">
                            <td colSpan={4} className="py-2.5 px-3">
                              <div className="flex flex-wrap items-center gap-4">
                                {/* Refill Date */}
                                <div className="flex items-center gap-2">
                                  <Calendar size={13} className="text-emerald-600 shrink-0" />
                                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    Refill Date
                                  </label>
                                  <input
                                    type="date"
                                    value={itemRefillDates[item.id] ?? ""}
                                    onChange={(e) =>
                                      setItemRefillDates((p) => ({ ...p, [item.id]: e.target.value }))
                                    }
                                    className="px-2.5 py-1 text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                                {/* Expire Date */}
                                <div className="flex items-center gap-2">
                                  <CalendarClock size={13} className="text-red-600 shrink-0" />
                                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    Expire Date
                                  </label>
                                  <input
                                    type="date"
                                    value={itemExpireDates[item.id] ?? ""}
                                    onChange={(e) =>
                                      setItemExpireDates((p) => ({ ...p, [item.id]: e.target.value }))
                                    }
                                    className="px-2.5 py-1 text-[11px] rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                  />
                                  {/* Expiry warning pill */}
                                  {expWarn && expWarn.level !== "ok" && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        expWarn.level === "expired"
                                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                          : expWarn.level === "danger"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      }`}
                                    >
                                      <AlertCircle size={10} />
                                      {expWarn.level === "expired"
                                        ? "EXPIRED"
                                        : `${expWarn.daysLeft}d left`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Temporary replacements to return to warehouse */}
          {pendingRepls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Box className="text-purple-600" size={15} />
                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                  Temporary Replacements (Return to Warehouse)
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                Returning these will create Stock Movement IN records and restore warehouse stock.
              </p>
              <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-purple-50/60 dark:bg-purple-950/20 text-[10px] uppercase text-purple-800 dark:text-purple-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Item</th>
                      <th className="py-2.5 px-3 text-center">Issued</th>
                      <th className="py-2.5 px-3 text-center">Already Returned</th>
                      <th className="py-2.5 px-3 text-center">Returning Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30">
                    {pendingRepls.map((repl) => {
                      const maxReturn = repl.issuedQty - repl.returnedQty;
                      return (
                        <tr key={repl.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{repl.inventory.name}</div>
                            <div className="text-[10px] font-mono text-gray-400">{repl.inventory.itemCode}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {repl.issuedQty} {repl.inventory.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-gray-400">{repl.returnedQty}</td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxReturn}
                              value={replReturns[repl.id] ?? 0}
                              onChange={(e) =>
                                setReplReturns((p) => ({ ...p, [repl.id]: Number(e.target.value) }))
                              }
                              className="w-20 text-center px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-bold focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-gray-400 ml-1.5">/ {maxReturn}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Return remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} /> Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <PackageCheck size={15} />
            {isPending ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
