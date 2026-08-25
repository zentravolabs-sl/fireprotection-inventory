"use client";

// ============================================================
// src/components/fire-extinguishers/ExpiringRefillItemsTable.tsx
// Expiry Warning Table — Customer Refill Items expiring within 30 days
// ============================================================

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  CalendarClock,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Building2,
  Flame,
} from "lucide-react";
import { getExpiringRefillItemsAction } from "@/app/actions/customer-refills";
import { formatDate } from "@/lib/dateUtils";

interface ExpiringItem {
  id: number;
  extinguisherType: string;
  capacity: string | null;
  receivedQty: number;
  returnedQty: number;
  refillDate: string | null;
  expireDate: string | null;
  customerRefill: {
    id: number;
    refillNo: string;
    status: string;
    customer: { id: number; companyName: string };
  };
}

function getDaysLeft(expireDate: string): number {
  return Math.floor(
    (new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function ExpiryBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <AlertTriangle size={10} /> EXPIRED
      </span>
    );
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
        <AlertTriangle size={10} /> {daysLeft}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
      <CalendarClock size={10} /> {daysLeft}d left
    </span>
  );
}

export function ExpiringRefillItemsTable() {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = () => {
    setLoading(true);
    startTransition(async () => {
      const res = await getExpiringRefillItemsAction();
      if (res.success && res.data) {
        // Serialize dates (they come as Date objects from server action)
        const raw = res.data as any[];
        setItems(
          raw.map((item) => ({
            ...item,
            refillDate: item.refillDate
              ? new Date(item.refillDate).toISOString()
              : null,
            expireDate: item.expireDate
              ? new Date(item.expireDate).toISOString()
              : null,
          }))
        );
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line

  if (!loading && items.length === 0) return null; // Hide table when nothing to show

  const expiredCount = items.filter(
    (i) => i.expireDate && getDaysLeft(i.expireDate) < 0
  ).length;
  const soonCount = items.filter(
    (i) => i.expireDate && getDaysLeft(i.expireDate) >= 0 && getDaysLeft(i.expireDate) <= 7
  ).length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
            <CalendarClock size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Upcoming Expirations
              {expiredCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  {expiredCount} expired
                </span>
              )}
              {soonCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
                  {soonCount} critical
                </span>
              )}
            </h2>
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
              Customer extinguisher refills expiring within 30 days
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading || isPending}
          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading || isPending ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <RefreshCw size={18} className="animate-spin text-red-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-red-50/40 dark:bg-red-950/10 text-[10px] font-bold uppercase text-red-800 dark:text-red-400">
              <tr>
                <th className="py-2.5 px-4">Refill Job</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Extinguisher</th>
                <th className="py-2.5 px-4">Capacity</th>
                <th className="py-2.5 px-4">Refill Date</th>
                <th className="py-2.5 px-4">Expire Date</th>
                <th className="py-2.5 px-4 text-center">Days Left</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100 dark:divide-red-900/20">
              {items.map((item) => {
                const daysLeft = item.expireDate ? getDaysLeft(item.expireDate) : null;
                const rowBg =
                  daysLeft === null
                    ? ""
                    : daysLeft < 0
                    ? "bg-rose-50/50 dark:bg-rose-950/10"
                    : daysLeft <= 7
                    ? "bg-red-50/40 dark:bg-red-950/10"
                    : "";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors ${rowBg}`}
                  >
                    {/* Refill job */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                        {item.customerRefill.refillNo}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px] font-black shrink-0">
                          {item.customerRefill.customer.companyName[0]}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {item.customerRefill.customer.companyName}
                        </span>
                      </div>
                    </td>

                    {/* Extinguisher type */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Flame size={12} className="text-red-600 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.extinguisherType}
                        </span>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3 px-4 text-gray-500">
                      {item.capacity ?? "—"}
                    </td>

                    {/* Refill date */}
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {item.refillDate ? formatDate(item.refillDate) : "—"}
                    </td>

                    {/* Expire date */}
                    <td className="py-3 px-4 font-semibold text-red-700 dark:text-red-400">
                      {item.expireDate ? formatDate(item.expireDate) : "—"}
                    </td>

                    {/* Days left badge */}
                    <td className="py-3 px-4 text-center">
                      {daysLeft !== null ? (
                        <ExpiryBadge daysLeft={daysLeft} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/fire-extinguishers/customer-refills/${item.customerRefill.id}`}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold transition-colors"
                      >
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
