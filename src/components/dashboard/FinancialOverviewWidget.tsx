"use client";

// ============================================================
// src/components/dashboard/FinancialOverviewWidget.tsx
// Financial Summary & Revenue vs. Expenses SVG Chart.
// Formats large numbers compactly (M for Millions, K for Thousands).
// ============================================================

import React from "react";
import { DollarSign } from "lucide-react";
import { FinancialOverviewSummary } from "@/lib/services/dashboardService";

interface FinancialOverviewWidgetProps {
  summary: FinancialOverviewSummary;
}

function formatLKRShort(val: number): string {
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    // Show 1 or 2 decimals if needed (e.g. 43M or 7.13M)
    const str = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
    return `LKR ${str}M`;
  }
  if (val >= 1_000) {
    const num = val / 1_000;
    const str = num % 1 === 0 ? num.toString() : num.toFixed(1).replace(/\.?0+$/, "");
    return `LKR ${str}K`;
  }
  return `LKR ${val.toLocaleString()}`;
}

function formatFullLKR(val: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function FinancialOverviewWidget({ summary }: FinancialOverviewWidgetProps) {
  const maxVal = Math.max(
    ...summary.monthlyTrends.map((t) => Math.max(t.revenue, t.expenses)),
    100_000
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
              <DollarSign size={18} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Financial Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Project values, expenses, & revenue trends
              </p>
            </div>
          </div>
        </div>

        {/* 4 Financial Metric Cards with Compact Formatting */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div
            title={`Full Amount: ${formatFullLKR(summary.totalProjectValue)}`}
            className="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl transition-colors hover:border-gray-300 dark:hover:border-gray-700"
          >
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block truncate">
              Total Project Value
            </span>
            <p className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 mt-1 truncate">
              {formatLKRShort(summary.totalProjectValue)}
            </p>
          </div>

          <div
            title={`Full Amount: ${formatFullLKR(summary.totalExpenses)}`}
            className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl transition-colors hover:border-amber-300 dark:hover:border-amber-800"
          >
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block truncate">
              Total Expenses
            </span>
            <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 mt-1 truncate">
              {formatLKRShort(summary.totalExpenses)}
            </p>
          </div>

          <div
            title={`Full Amount: ${formatFullLKR(summary.paymentsReceived)}`}
            className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl transition-colors hover:border-emerald-300 dark:hover:border-emerald-800"
          >
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block truncate">
              Payments Received
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 truncate">
              {formatLKRShort(summary.paymentsReceived)}
            </p>
          </div>

          <div
            title={`Full Amount: ${formatFullLKR(summary.outstandingPayments)}`}
            className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl transition-colors hover:border-purple-300 dark:hover:border-purple-800"
          >
            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block truncate">
              Outstanding Payments
            </span>
            <p className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 mt-1 truncate">
              {formatLKRShort(summary.outstandingPayments)}
            </p>
          </div>
        </div>

        {/* Monthly Revenue vs Expense SVG Bar Chart */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold text-gray-800 dark:text-gray-200">Revenue vs Expenses (Last 6 Months)</span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
            {summary.monthlyTrends.map((t, idx) => {
              const revHeightPct = Math.round((t.revenue / maxVal) * 100);
              const expHeightPct = Math.round((t.expenses / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Revenue Bar */}
                    <div
                      className="w-1/2 max-w-[16px] bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-300 relative group/bar"
                      style={{ height: `${Math.max(8, revHeightPct)}%` }}
                    >
                      <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                        Rev: {(t.revenue / 1000).toFixed(0)}K
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div
                      className="w-1/2 max-w-[16px] bg-amber-500 hover:bg-amber-400 rounded-t transition-all duration-300 relative group/bar"
                      style={{ height: `${Math.max(8, expHeightPct)}%` }}
                    >
                      <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                        Exp: {(t.expenses / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium text-gray-500 mt-2">
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
