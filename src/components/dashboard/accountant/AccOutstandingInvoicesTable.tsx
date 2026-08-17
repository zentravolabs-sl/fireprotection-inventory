"use client";

// ============================================================
// src/components/dashboard/accountant/AccOutstandingInvoicesTable.tsx
// Table displaying Outstanding Customer Invoices.
// ============================================================

import React from "react";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { OutstandingInvoiceItem } from "@/lib/services/accountantDashboardService";

interface AccOutstandingInvoicesTableProps {
  invoices: OutstandingInvoiceItem[];
}

function formatLKR(val: number): string {
  return `Rs. ${val.toLocaleString()}`;
}

export function AccOutstandingInvoicesTable({ invoices }: AccOutstandingInvoicesTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Outstanding Invoices
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unpaid customer billing records requiring collection follow-up
              </p>
            </div>
          </div>

          <Link
            href="/cost-approvals"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            View All Invoices <ExternalLink size={12} />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No outstanding invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Invoice No</th>
                  <th className="pb-3 px-4">Client</th>
                  <th className="pb-3 px-4">Project</th>
                  <th className="pb-3 px-4">Inv Date</th>
                  <th className="pb-3 px-4">Due Date</th>
                  <th className="pb-3 px-4 text-right">Amount</th>
                  <th className="pb-3 px-4 text-right">Paid</th>
                  <th className="pb-3 px-4 text-right">Balance</th>
                  <th className="pb-3 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {invoices.map((inv) => {
                  let badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300";
                  if (inv.status === "Overdue") {
                    badgeStyle = "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 font-bold";
                  } else if (inv.status === "Paid") {
                    badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300";
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-gray-900 dark:text-gray-100">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {inv.clientName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {inv.projectName}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {formatLKR(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatLKR(inv.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                        {formatLKR(inv.balance)}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${badgeStyle}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
