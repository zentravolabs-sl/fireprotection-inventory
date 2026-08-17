"use client";

// ============================================================
// src/components/dashboard/accountant/AccAccountsReceivableWidget.tsx
// Accounts Receivable Aging Chart (Current, 1-30d, 31-60d, 61-90d, 90+d).
// ============================================================

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccountsReceivableData } from "@/lib/services/accountantDashboardService";

interface AccAccountsReceivableWidgetProps {
  data: AccountsReceivableData;
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

export function AccAccountsReceivableWidget({ data }: AccAccountsReceivableWidgetProps) {
  const buckets = [
    { label: "Current", amount: data.current, color: "bg-emerald-500" },
    { label: "1–30 Days", amount: data.days1to30, color: "bg-amber-500" },
    { label: "31–60 Days", amount: data.days31to60, color: "bg-orange-500" },
    { label: "61–90 Days", amount: data.days61to90, color: "bg-red-500" },
    { label: "90+ Days", amount: data.days90Plus, color: "bg-rose-700" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Accounts Receivable
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            Total: {formatLKRShort(data.totalReceivable)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Customer invoice aging distribution by payment due window
        </p>

        <div className="space-y-3">
          {buckets.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {b.label}
                </span>
              </div>
              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                {formatLKRShort(b.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/cost-approvals"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
        >
          View Invoices <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
