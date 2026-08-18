"use client";

// ============================================================
// src/app/(Main)/reports/ReportsClientPage.tsx
// Client component for Central Fire Protection ERP Reports
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/dateUtils";
import { ScrollableTabs, TabItem } from "@/components/ui/ScrollableTabs";

interface ReportsClientPageProps {
  costSummaryReport: any[];
  categoryExpenseReport: any[];
  transportReport: any[];
  engineerReport: any[];
  customerReport: any[];
  transferReport?: any[];
}

type ReportTabType =
  | "cost-summary"
  | "material"
  | "transport"
  | "labour"
  | "expense-analysis"
  | "budget-vs-actual"
  | "profit-loss"
  | "engineers"
  | "customers"
  | "transfers";

export function ReportsClientPage({
  costSummaryReport,
  categoryExpenseReport,
  transportReport,
  engineerReport,
  customerReport,
  transferReport = [],
}: ReportsClientPageProps) {
  const [activeReport, setActiveReport] = useState<ReportTabType>("cost-summary");

  const totalEstimatedOverall = costSummaryReport.reduce((sum, r) => sum + r.estimatedTotalCost, 0);
  const totalActualOverall = costSummaryReport.reduce((sum, r) => sum + r.actualTotalCost, 0);
  const totalVarianceOverall = totalEstimatedOverall - totalActualOverall;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Fire Protection ERP Reports & Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive financial audit, budget variance, expense analysis & engineering project breakdown.
            </p>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Portfolio Budget</span>
            <div className="text-xl font-bold text-blue-950 dark:text-blue-100 mt-1">{formatCurrency(totalEstimatedOverall)}</div>
          </div>

          <div className="p-4 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Total Portfolio Expenses</span>
            <div className="text-xl font-bold text-red-950 dark:text-red-100 mt-1">{formatCurrency(totalActualOverall)}</div>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Portfolio Net Variance</span>
            <div className={`text-xl font-bold mt-1 ${totalVarianceOverall >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>
              {formatCurrency(totalVarianceOverall)}
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      {(() => {
        const reportTabs: TabItem<ReportTabType>[] = [
          { id: "cost-summary", label: "Project Cost Summary", icon: "📊", count: costSummaryReport.length, category: "financial" },
          { id: "material", label: "Material Cost Report", icon: "📦", count: costSummaryReport.length, category: "costs" },
          { id: "transport", label: "Transport Cost Report", icon: "🚚", count: transportReport.length, category: "costs" },
          { id: "labour", label: "Labour Cost Report", icon: "👷", count: costSummaryReport.length, category: "costs" },
          { id: "expense-analysis", label: "Expense Analysis", icon: "💵", count: categoryExpenseReport.length, category: "financial" },
          { id: "budget-vs-actual", label: "Budget vs Actual", icon: "📉", count: costSummaryReport.length, category: "financial" },
          { id: "profit-loss", label: "Profit / Loss Ranking", icon: "🏆", count: costSummaryReport.length, category: "financial" },
          { id: "engineers", label: "Engineer-wise Projects", icon: "👥", count: engineerReport.length, category: "breakdown" },
          { id: "customers", label: "Customer-wise Projects", icon: "🏢", count: customerReport.length, category: "breakdown" },
          { id: "transfers", label: "Project Transfer History", icon: "🔄", count: transferReport.length, category: "breakdown" },
        ];

        return (
          <ScrollableTabs<ReportTabType>
            tabs={reportTabs}
            categories={[
              { id: "financial", label: "Financial & Audit" },
              { id: "costs", label: "Cost Reports" },
              { id: "breakdown", label: "Entities & History" },
            ]}
            activeTab={activeReport}
            onTabChange={(tabId) => setActiveReport(tabId)}
          />
        );
      })()}

      {/* REPORT CONTENT AREA */}

      {/* REPORT 1: PROJECT COST SUMMARY */}
      {activeReport === "cost-summary" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Cost Summary Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Lead Engineer</th>
                  <th className="px-4 py-3 text-right">Project Value</th>
                  <th className="px-4 py-3 text-right">Estimated Cost</th>
                  <th className="px-4 py-3 text-right">Actual Cost</th>
                  <th className="px-4 py-3 text-right">Estimated Profit</th>
                  <th className="px-4 py-3 text-right">Actual Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">
                      <Link href={`/projects/${r.id}`} className="hover:underline hover:text-red-600">
                        {r.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700 dark:text-gray-300">{r.leadEngineer}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-950 dark:text-indigo-200">{formatCurrency(r.projectValue || 0)}</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(r.estimatedTotalCost || 0)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(r.actualTotalCost || 0)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${(r.estimatedProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.estimatedProfit || 0)}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold ${(r.actualProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.actualProfit || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: MATERIAL COST REPORT */}
      {activeReport === "material" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Material Cost Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Est. Material Cost</th>
                  <th className="px-4 py-3 text-right">Actual FIFO Material Issue Cost</th>
                  <th className="px-4 py-3 text-right">Material Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-teal-600 dark:text-teal-400">{formatCurrency(r.actualTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatCurrency(r.costVariance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: TRANSPORT COST REPORT */}
      {activeReport === "transport" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Transport Cost Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transport #</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Vehicle #</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Dispatch Date</th>
                  <th className="px-4 py-3 text-right">Fuel Cost</th>
                  <th className="px-4 py-3 text-right">Vehicle Hire</th>
                  <th className="px-4 py-3 text-right">Loading/Unloading</th>
                  <th className="px-4 py-3 text-right">Total Transport Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {transportReport.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{t.transportNo}</td>
                    <td className="px-4 py-3.5 font-medium">{t.project?.projectName} ({t.project?.projectCode})</td>
                    <td className="px-4 py-3.5 font-semibold">{t.vehicleNumber}</td>
                    <td className="px-4 py-3.5">{t.driverName}</td>
                    <td className="px-4 py-3.5">{formatDate(t.transportDate)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.fuelCost)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.vehicleHireCost)}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(t.loadingCost + t.unloadingCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(t.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: LABOUR COST REPORT */}
      {activeReport === "labour" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Labour Expenses Report</h3>
          <p className="text-xs text-gray-500">Project-wise Labour costs logged via the expense ledger.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Est. Labour Cost</th>
                  <th className="px-4 py-3 text-right">Actual Labour Expense</th>
                  <th className="px-4 py-3 text-right">Labour Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(r.actualTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold">{formatCurrency(r.costVariance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: EXPENSE ANALYSIS */}
      {activeReport === "expense-analysis" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Expense Analysis by Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryExpenseReport.map((cat) => (
              <div key={cat.expenseType} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{cat.expenseType}</span>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(cat.totalAmount)}</div>
                <div className="text-xs text-gray-400">{cat.count} total ledger entry(ies)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT 6: BUDGET VS ACTUAL */}
      {activeReport === "budget-vs-actual" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Budget vs Actual Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3 text-right">Est. Budget</th>
                  <th className="px-4 py-3 text-right">Actual Expenses</th>
                  <th className="px-4 py-3 text-right">Variance (Remaining)</th>
                  <th className="px-4 py-3">Budget Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{r.projectCode}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600">{formatCurrency(r.actualTotalCost)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${r.budgetBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(r.budgetBalance)}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.budgetBalance >= 0 ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-green-100 text-green-800 rounded-full">
                          UNDER BUDGET
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-red-100 text-red-800 rounded-full">
                          OVER BUDGET 🚨
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 7: PROJECT PROFIT / LOSS */}
      {activeReport === "profit-loss" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Project Profitability Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Contract Value</th>
                  <th className="px-4 py-3 text-right">Actual Cost</th>
                  <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {costSummaryReport.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-bold">#{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium">{r.projectName} ({r.projectCode})</td>
                    <td className="px-4 py-3.5">{r.customerName}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.estimatedTotalCost)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(r.actualTotalCost)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${r.profitOrLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(r.profitOrLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 8: ENGINEER-WISE PROJECTS */}
      {activeReport === "engineers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Engineer-wise Projects Allocation Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Engineer Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Total Projects Assigned</th>
                  <th className="px-4 py-3 text-center">Lead Projects</th>
                  <th className="px-4 py-3 text-center">Active Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {engineerReport.map((eng) => (
                  <tr key={eng.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{eng.name}</td>
                    <td className="px-4 py-3.5 text-gray-500">{eng.email}</td>
                    <td className="px-4 py-3.5 font-semibold">{eng.role}</td>
                    <td className="px-4 py-3.5 text-center font-bold">{eng.totalProjectsAssigned}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-amber-600">⭐ {eng.leadProjectsCount}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">{eng.activeProjectsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 9: CUSTOMER-WISE PROJECTS */}
      {activeReport === "customers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Customer-wise Projects Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Company</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-center">Total Projects</th>
                  <th className="px-4 py-3 text-center">Active Projects</th>
                  <th className="px-4 py-3 text-right">Total Portfolio Budget</th>
                  <th className="px-4 py-3 text-right">Total Actual Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {customerReport.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{c.companyName}</td>
                    <td className="px-4 py-3.5">{c.contactPerson || "N/A"}</td>
                    <td className="px-4 py-3.5 text-gray-500">{c.phone || "N/A"}</td>
                    <td className="px-4 py-3.5 text-center font-bold">{c.totalProjects}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">{c.activeProjects}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(c.totalEstimatedBudget)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600">{formatCurrency(c.totalActualExpense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 10: PROJECT TRANSFER HISTORY */}
      {activeReport === "transfers" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Project-to-Project Transfer History & Cost Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Transfer No</th>
                  <th className="px-4 py-3">From Project</th>
                  <th className="px-4 py-3">To Project</th>
                  <th className="px-4 py-3">Transfer Date</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3 text-right">Transfer Value</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!transferReport || transferReport.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">
                      No project transfers recorded yet.
                    </td>
                  </tr>
                ) : (
                  transferReport.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">
                        {t.transferNo}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{t.fromProject?.projectCode} — {t.fromProject?.projectName}</td>
                      <td className="px-4 py-3.5 font-medium text-emerald-600 dark:text-emerald-400">{t.toProject?.projectCode} — {t.toProject?.projectName}</td>
                      <td className="px-4 py-3.5">{formatDate(t.transferDate)}</td>
                      <td className="px-4 py-3.5 font-bold">{(t.items || []).length} Item(s)</td>
                      <td className="px-4 py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(t.totalValue || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{t.requestedBy?.name || "System"}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsClientPage;
