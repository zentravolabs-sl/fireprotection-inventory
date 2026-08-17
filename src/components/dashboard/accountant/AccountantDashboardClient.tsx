"use client";

// ============================================================
// src/components/dashboard/accountant/AccountantDashboardClient.tsx
// Container Component for the Accountant Finance Dashboard.
// ============================================================

import React, { useState } from "react";
import { AccHeader } from "./AccHeader";
import { AccKpiCards } from "./AccKpiCards";
import { AccRevenueVsExpensesChart } from "./AccRevenueVsExpensesChart";
import { AccCashFlowWidget } from "./AccCashFlowWidget";
import { AccAccountsReceivableWidget } from "./AccAccountsReceivableWidget";
import { AccAccountsPayableWidget } from "./AccAccountsPayableWidget";
import { AccOutstandingInvoicesTable } from "./AccOutstandingInvoicesTable";
import { AccRecentTransactionsTable } from "./AccRecentTransactionsTable";
import { AccProjectFinancialOverviewTable } from "./AccProjectFinancialOverviewTable";
import { AccExpenseBreakdownChart } from "./AccExpenseBreakdownChart";
import { AccPendingPaymentsTable } from "./AccPendingPaymentsTable";
import { AccFinancialAlerts } from "./AccFinancialAlerts";
import { AccQuickActionsWidget } from "./AccQuickActionsWidget";
import { AccFinancialSummary } from "./AccFinancialSummary";

import {
  AccountantKpiCardsData,
  RevenueExpensePoint,
  CashFlowData,
  AccountsReceivableData,
  AccountsPayableData,
  OutstandingInvoiceItem,
  RecentTransactionItem,
  ProjectFinancialItem,
  ExpenseCategoryBreakdown,
  PendingPaymentItem,
  FinancialAlertItem,
  FinancialSummaryData,
} from "@/lib/services/accountantDashboardService";

export interface AccountantDashboardData {
  kpis: AccountantKpiCardsData;
  revenueAndExpenses: RevenueExpensePoint[];
  cashFlow: CashFlowData;
  receivables: AccountsReceivableData;
  payables: AccountsPayableData;
  outstandingInvoices: OutstandingInvoiceItem[];
  recentTransactions: RecentTransactionItem[];
  projectFinancials: ProjectFinancialItem[];
  expenseBreakdown: ExpenseCategoryBreakdown[];
  pendingPayments: PendingPaymentItem[];
  alerts: FinancialAlertItem[];
  summary: FinancialSummaryData;
}

interface AccountantDashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  data: AccountantDashboardData;
}

export function AccountantDashboardClient({ user, data }: AccountantDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("month");

  // Filter outstanding invoices by search query
  const filteredInvoices = data.outstandingInvoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER BAR ────────────────────────────────────────────────── */}
      <AccHeader
        userName={user.name || "Finance Accountant"}
        userEmail={user.email || "accountant@firepro.lk"}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
      />

      {/* ── 6 FINANCIAL KPI CARDS ────────────────────────────────────── */}
      <AccKpiCards data={data.kpis} />

      {/* ── MAIN FINANCIAL CHARTS (Revenue vs Expenses & Cash Flow) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccRevenueVsExpensesChart points={data.revenueAndExpenses} />
        </div>
        <div>
          <AccCashFlowWidget data={data.cashFlow} />
        </div>
      </div>

      {/* ── CASH FLOW & EXPENSE BREAKDOWN ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccExpenseBreakdownChart categories={data.expenseBreakdown} />
        </div>
        <div>
          <AccFinancialSummary summary={data.summary} />
        </div>
      </div>

      {/* ── ACCOUNTS RECEIVABLE & ACCOUNTS PAYABLE ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccAccountsReceivableWidget data={data.receivables} />
        <AccAccountsPayableWidget data={data.payables} />
      </div>

      {/* ── OUTSTANDING INVOICES & PENDING PAYMENTS ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccOutstandingInvoicesTable invoices={filteredInvoices} />
        </div>
        <div>
          <AccPendingPaymentsTable payments={data.pendingPayments} />
        </div>
      </div>

      {/* ── PROJECT FINANCIAL OVERVIEW ────────────────────────────────── */}
      <AccProjectFinancialOverviewTable projects={data.projectFinancials} />

      {/* ── RECENT TRANSACTIONS & FINANCIAL ALERTS ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccRecentTransactionsTable transactions={data.recentTransactions} />
        </div>
        <div>
          <AccFinancialAlerts alerts={data.alerts} />
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
      <AccQuickActionsWidget />
    </div>
  );
}
