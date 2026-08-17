"use client";

// ============================================================
// src/components/dashboard/accountant/AccPendingPaymentsTable.tsx
// Pending Payments Queue (Customer Receivables & Supplier Payables).
// ============================================================

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { PendingPaymentItem } from "@/lib/services/accountantDashboardService";

interface AccPendingPaymentsTableProps {
  payments: PendingPaymentItem[];
}

function formatLKR(val: number): string {
  return `Rs. ${val.toLocaleString()}`;
}

export function AccPendingPaymentsTable({ payments }: AccPendingPaymentsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Pending Payments
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Incoming customer receivables & outgoing supplier payables
              </p>
            </div>
          </div>

          <Link
            href="/cost-approvals"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            View Payments <ArrowUpRight size={12} />
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No pending payments in queue.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.type === "Customer Payment"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      }`}
                    >
                      {p.type}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {p.payeeOrPayer}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.projectName} • Due: {p.dueDate}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                    {formatLKR(p.amount)}
                  </p>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
