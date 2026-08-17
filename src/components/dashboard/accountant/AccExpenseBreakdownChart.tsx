"use client";

// ============================================================
// src/components/dashboard/accountant/AccExpenseBreakdownChart.tsx
// Expense Breakdown Donut/Category Chart.
// ============================================================

import React from "react";
import { PieChart } from "lucide-react";
import { ExpenseCategoryBreakdown } from "@/lib/services/accountantDashboardService";

interface AccExpenseBreakdownChartProps {
  categories: ExpenseCategoryBreakdown[];
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

export function AccExpenseBreakdownChart({ categories }: AccExpenseBreakdownChartProps) {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-red-500",
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <PieChart size={18} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Expense Breakdown
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Cost distribution across project operational categories
        </p>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No expense records found.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, idx) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                      {cat.category.toLowerCase()}
                    </span>
                  </div>
                  <div className="font-mono text-gray-900 dark:text-gray-100 font-bold">
                    {formatLKRShort(cat.amount)}{" "}
                    <span className="text-gray-400 font-normal">({cat.percentage}%)</span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(4, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
