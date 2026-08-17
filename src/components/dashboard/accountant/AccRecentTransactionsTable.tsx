"use client";

// ============================================================
// src/components/dashboard/accountant/AccRecentTransactionsTable.tsx
// Financial Transaction Log Stream for Accountant.
// ============================================================

import React from "react";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { RecentTransactionItem } from "@/lib/services/accountantDashboardService";

interface AccRecentTransactionsTableProps {
  transactions: RecentTransactionItem[];
}

function formatLKR(val: number): string {
  return `Rs. ${val.toLocaleString()}`;
}

export function AccRecentTransactionsTable({ transactions }: AccRecentTransactionsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Recent Transactions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live financial audit entries: Payments, Expenses & Invoices
            </p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No recent transactions recorded.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.isIncome
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                    }`}
                  >
                    {tx.isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {tx.type}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {tx.description} ({tx.referenceNo})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xs font-mono font-bold ${
                      tx.isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tx.isIncome ? "+" : "-"} {formatLKR(tx.amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
