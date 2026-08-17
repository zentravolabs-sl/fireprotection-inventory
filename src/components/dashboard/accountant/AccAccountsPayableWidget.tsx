"use client";

// ============================================================
// src/components/dashboard/accountant/AccAccountsPayableWidget.tsx
// Accounts Payable Summary (Current, Overdue, Upcoming).
// ============================================================

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccountsPayableData } from "@/lib/services/accountantDashboardService";

interface AccAccountsPayableWidgetProps {
  data: AccountsPayableData;
}

function formatLKRShort(val: number): string {
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.?0+$/, "");
    return `Rs. ${str}M`;
  }
  if (val >= 1_000) {
    const num = val / 1_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(0);
    return `Rs. ${str}K`;
  }
  return `Rs. ${val.toLocaleString()}`;
}

export function AccAccountsPayableWidget({ data }: AccAccountsPayableWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Accounts Payable
          </h3>
          <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
            Total: {formatLKRShort(data.totalPayable)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Supplier, vendor & contractor payment obligations
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Current Payables
            </span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
              {formatLKRShort(data.currentPayables)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 text-red-900 dark:text-red-300">
            <span className="font-semibold">Overdue Payables</span>
            <span className="font-mono font-bold">{formatLKRShort(data.overduePayables)}</span>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
            <span className="font-semibold">Upcoming Payments</span>
            <span className="font-mono font-bold">{formatLKRShort(data.upcomingPayments)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/cost-approvals"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
        >
          View Payables <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
