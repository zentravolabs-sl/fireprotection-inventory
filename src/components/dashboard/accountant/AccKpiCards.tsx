"use client";

// ============================================================
// src/components/dashboard/accountant/AccKpiCards.tsx
// 6 Primary Financial KPI Cards for Accountant.
// ============================================================

import React from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Clock,
  Briefcase,
} from "lucide-react";
import { AccountantKpiCardsData } from "@/lib/services/accountantDashboardService";

interface AccKpiCardsProps {
  data: AccountantKpiCardsData;
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

export function AccKpiCards({ data }: AccKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ── CARD 1: TOTAL REVENUE ─────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.totalRevenue)}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            +{data.totalRevenueChangePct}% from previous period
          </p>
        </div>
      </div>

      {/* ── CARD 2: TOTAL EXPENSES ────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.totalExpenses)}
          </p>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
            +{data.totalExpensesChangePct}% from previous period
          </p>
        </div>
      </div>

      {/* ── CARD 3: NET PROFIT ────────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Net Profit
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <PieChart size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.netProfit)}
          </p>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
            {data.profitMarginPct}% profit margin
          </p>
        </div>
      </div>

      {/* ── CARD 4: OUTSTANDING INVOICES ──────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Outstanding Invoices
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.outstandingInvoicesAmount)}
          </p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {data.outstandingInvoicesCount} invoices
          </p>
        </div>
      </div>

      {/* ── CARD 5: PENDING PAYMENTS ──────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Pending Payments
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Clock size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.pendingPaymentsAmount)}
          </p>
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
            {data.pendingPaymentsCount} payments
          </p>
        </div>
      </div>

      {/* ── CARD 6: PROJECT COSTS ─────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Project Costs
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Briefcase size={18} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {formatLKRShort(data.projectCosts)}
          </p>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
            {data.projectCostsPctOfExpenses}% of total expenses
          </p>
        </div>
      </div>
    </div>
  );
}
