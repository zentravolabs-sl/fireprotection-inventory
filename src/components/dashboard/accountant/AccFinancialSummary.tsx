"use client";

// ============================================================
// src/components/dashboard/accountant/AccFinancialSummary.tsx
// Compact Executive Financial Summary Card.
// ============================================================

import React from "react";
import { DollarSign } from "lucide-react";
import { FinancialSummaryData } from "@/lib/services/accountantDashboardService";

interface AccFinancialSummaryProps {
  summary: FinancialSummaryData;
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

export function AccFinancialSummary({ summary }: AccFinancialSummaryProps) {
  return (
    <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
        <DollarSign size={160} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-base font-bold text-emerald-100 uppercase tracking-wider">
            Financial Summary
          </h3>
        </div>
        <p className="text-xs text-emerald-200/80 mb-5">
          Dynamic executive ledger calculations
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Revenue (Month)
            </span>
            <p className="text-xl font-black mt-0.5">
              {formatLKRShort(summary.revenueThisMonth)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Expenses (Month)
            </span>
            <p className="text-xl font-black mt-0.5">
              {formatLKRShort(summary.expensesThisMonth)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Net Profit
            </span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">
              {formatLKRShort(summary.netProfitThisMonth)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Receivables
            </span>
            <p className="text-xl font-black mt-0.5">
              {formatLKRShort(summary.outstandingReceivables)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Payables
            </span>
            <p className="text-xl font-black mt-0.5">
              {formatLKRShort(summary.pendingPayables)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block">
              Profit Margin
            </span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">
              {summary.profitMarginPct}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
