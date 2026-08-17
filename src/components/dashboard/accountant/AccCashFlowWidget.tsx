"use client";

// ============================================================
// src/components/dashboard/accountant/AccCashFlowWidget.tsx
// Cash Flow Overview (Cash In, Cash Out, Net Cash Flow).
// ============================================================

import React from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CashFlowData } from "@/lib/services/accountantDashboardService";

interface AccCashFlowWidgetProps {
  data: CashFlowData;
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

export function AccCashFlowWidget({ data }: AccCashFlowWidgetProps) {
  const isNetPositive = data.netCashFlow >= 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Cash Flow
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Real-time liquidity tracking: Cash In vs Cash Out
        </p>

        {/* 3 Metric Pill Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-0.5">
              Cash In <ArrowUpRight size={10} />
            </span>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
              {formatLKRShort(data.cashIn)}
            </p>
          </div>

          <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl">
            <span className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider block flex items-center gap-0.5">
              Cash Out <ArrowDownRight size={10} />
            </span>
            <p className="text-base font-black text-red-700 dark:text-red-300 font-mono mt-0.5">
              {formatLKRShort(data.cashOut)}
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            isNetPositive
              ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40"
              : "bg-orange-50/60 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40"
          }`}>
            <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
              Net Cash Flow
            </span>
            <p className="text-base font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
              {formatLKRShort(data.netCashFlow)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
