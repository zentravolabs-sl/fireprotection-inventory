"use client";

// ============================================================
// src/components/dashboard/accountant/AccQuickActionsWidget.tsx
// Operational Action Bar for Accountant.
// ============================================================

import React from "react";
import Link from "next/link";
import { FileText, PlusCircle, CreditCard, DollarSign, BarChart3 } from "lucide-react";

export function AccQuickActionsWidget() {
  const actions = [
    { label: "Create Invoice", href: "/cost-approvals", icon: FileText, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" },
    { label: "Record Payment", href: "/cost-approvals", icon: CreditCard, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" },
    { label: "Add Expense", href: "/cost-approvals", icon: PlusCircle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50" },
    { label: "Create Payment", href: "/cost-approvals", icon: DollarSign, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50" },
    { label: "View Invoices", href: "/cost-approvals", icon: FileText, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50" },
    { label: "View Financial Reports", href: "/reports", icon: BarChart3, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
        Quick Actions
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Direct accounting workflows and financial entries
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 transition-all text-center group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${act.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
