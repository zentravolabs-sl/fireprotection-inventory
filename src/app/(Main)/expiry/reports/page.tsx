"use client";

// ============================================================
// src/app/(Main)/expiry/reports/page.tsx
// Expiry Stock Reports & Supplier Expiry Report View.
// ============================================================

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Filter,
  ArrowLeft,
  Printer,
  Download,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Package,
} from "lucide-react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import {
  getExpiryReportAction,
  getSupplierExpiryReportAction,
} from "../actions";
import type { ExpiryBatchDetail, SupplierExpirySummary } from "@/lib/services/expiryService";

export const dynamic = "force-dynamic";

const REPORT_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "EXPIRED", label: "EXPIRED Only" },
  { value: "EXPIRING_SOON", label: "EXPIRING SOON Only" },
  { value: "VALID", label: "VALID Only" },
  { value: "NO_EXPIRY", label: "NO EXPIRY" },
];

const REPORT_RANGE_OPTIONS = [
  { value: "7", label: "Window: 7 Days" },
  { value: "14", label: "Window: 14 Days" },
  { value: "30", label: "Window: 30 Days" },
  { value: "60", label: "Window: 60 Days" },
  { value: "90", label: "Window: 90 Days" },
];

export default function ExpiryReportsPage() {
  const [activeTab, setActiveTab] = useState<"STOCK" | "SUPPLIER">("STOCK");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Stock Report Data
  const [stockReport, setStockReport] = useState<{
    items: ExpiryBatchDetail[];
    totalItemsCount: number;
    totalQty: number;
    totalValue: number;
  }>({ items: [], totalItemsCount: 0, totalQty: 0, totalValue: 0 });

  // Supplier Report Data
  const [supplierReport, setSupplierReport] = useState<SupplierExpirySummary[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rangeFilter, setRangeFilter] = useState<string>("30");

  const loadReports = () => {
    setLoading(true);
    startTransition(async () => {
      if (activeTab === "STOCK") {
        const res = await getExpiryReportAction({
          status: statusFilter ? (statusFilter as any) : undefined,
          expiryRange: rangeFilter as any,
          page: 1,
          limit: 1000,
        });
        if (res.success && res.data) {
          setStockReport(res.data);
        }
      } else {
        const res = await getSupplierExpiryReportAction({
          expiryRange: rangeFilter as any,
          page: 1,
          limit: 1000,
        });
        if (res.success && res.data) {
          setSupplierReport(res.data);
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadReports();
  }, [activeTab, statusFilter, rangeFilter]);

  const formatCurrency = (val: number) =>
    `LKR ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "--";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F1524] p-6 rounded-2xl border border-gray-200/80 dark:border-[#1e2a3d] shadow-sm">
        <div>
          <Link
            href="/expiry"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-[#5a657a] hover:text-red-600 dark:hover:text-red-400 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Expiry Management
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-[#dce3ef] tracking-tight">
            Inventory Expiry Reports
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#5a657a] mt-1">
            Comprehensive audit reports for stock valuation, upcoming expirations & supplier analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-[#dce3ef] bg-gray-50 dark:bg-[#161d2e] hover:bg-gray-100 dark:hover:bg-[#1e2a3d] border border-gray-200 dark:border-[#1e2a3d] rounded-xl transition-colors"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white dark:bg-[#0F1524] p-4 rounded-2xl border border-gray-200/80 dark:border-[#1e2a3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#161d2e] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "STOCK"
                ? "bg-white dark:bg-[#1e2a3d] text-gray-900 dark:text-[#dce3ef] shadow-sm"
                : "text-gray-600 dark:text-[#5a657a] hover:text-gray-900 dark:hover:text-[#dce3ef]"
            }`}
          >
            <FileText size={15} /> Expiry Stock Report
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIER")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "SUPPLIER"
                ? "bg-white dark:bg-[#1e2a3d] text-gray-900 dark:text-[#dce3ef] shadow-sm"
                : "text-gray-600 dark:text-[#5a657a] hover:text-gray-900 dark:hover:text-[#dce3ef]"
            }`}
          >
            <Building2 size={15} /> Supplier Expiry Report
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "STOCK" && (
            <div className="w-48 sm:w-56">
              <Select
                instanceId="report-status-filter"
                classNamePrefix="react-select"
                options={REPORT_STATUS_OPTIONS}
                value={REPORT_STATUS_OPTIONS.find((opt) => opt.value === statusFilter) || REPORT_STATUS_OPTIONS[0]}
                onChange={(val) => setStatusFilter(val ? val.value : "")}
                isSearchable={false}
                styles={getCustomSelectStyles(false, "40px")}
              />
            </div>
          )}

          <div className="w-48 sm:w-56">
            <Select
              instanceId="report-range-filter"
              classNamePrefix="react-select"
              options={REPORT_RANGE_OPTIONS}
              value={REPORT_RANGE_OPTIONS.find((opt) => opt.value === rangeFilter) || REPORT_RANGE_OPTIONS[2]}
              onChange={(val) => val && setRangeFilter(val.value)}
              isSearchable={false}
              styles={getCustomSelectStyles(false, "40px")}
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Expiry Stock Report */}
      {activeTab === "STOCK" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Total Batches: {stockReport.totalItemsCount}</span>
            <span>Total Stock Quantity: {stockReport.totalQty}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Total Stock Value: {formatCurrency(stockReport.totalValue)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Batch No</th>
                  <th className="px-4 py-3">Receive Date</th>
                  <th className="px-4 py-3">Mfg Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3 text-right">Available Qty</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Stock Value</th>
                  <th className="px-4 py-3 text-center">Days Remaining</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Loading expiry report...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : stockReport.items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M7 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                        </svg>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          No batch records found for this report filter.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stockReport.items.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                        {row.inventory.name}
                        <span className="block text-xs font-mono text-gray-400 dark:text-gray-500 font-normal">
                          {row.inventory.itemCode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                        {row.inventory.category.categoryName}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                        {row.supplier?.company || "N/A"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {row.batchNo}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">{formatDate(row.receiveDate)}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">{formatDate(row.manufactureDate)}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{formatDate(row.expiryDate)}</td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        {row.availableQty} {row.inventory.unit}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-600 dark:text-gray-400 tabular-nums">
                        LKR {row.unitCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatCurrency(row.stockValue)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-gray-900 dark:text-gray-100">
                        {row.daysRemaining !== null ? `${row.daysRemaining}d` : "--"}
                      </td>
                      <td className="px-4 py-3.5">
                        {row.status === "EXPIRED" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/40 rounded-full">
                            EXPIRED
                          </span>
                        )}
                        {row.status === "EXPIRING_SOON" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-full">
                            EXPIRING SOON
                          </span>
                        )}
                        {row.status === "VALID" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 rounded-full">
                            VALID
                          </span>
                        )}
                        {row.status === "NO_EXPIRY" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
                            NO EXPIRY
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Expiry Report */}
      {activeTab === "SUPPLIER" && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white dark:bg-gray-900 p-12 text-center text-gray-400 dark:text-gray-500 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Loading supplier expiry analysis...
                </span>
              </div>
            </div>
          ) : supplierReport.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-12 text-center text-gray-400 dark:text-gray-500 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M7 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                </svg>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No expiring or expired batches associated with suppliers under the current threshold.
                </span>
              </div>
            </div>
          ) : (
            supplierReport.map((sup) => (
              <div key={sup.supplierId} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
                <div className="p-4 bg-gray-900 dark:bg-gray-800 text-white rounded-lg flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Building2 size={18} className="text-red-400" /> {sup.company}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">
                      Contact: {sup.contactPerson || "N/A"} | Phone: {sup.phone || "N/A"} | Email: {sup.email || "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300">
                      Expiring ({sup.totalExpiringBatches}): <span className="font-bold text-white">{formatCurrency(sup.totalExpiringValue)}</span>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl text-red-300">
                      Expired ({sup.totalExpiredBatches}): <span className="font-bold text-white">{formatCurrency(sup.totalExpiredValue)}</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Item Code</th>
                        <th className="px-4 py-3">Batch No</th>
                        <th className="px-4 py-3">Expiry Date</th>
                        <th className="px-4 py-3 text-right">Available Qty</th>
                        <th className="px-4 py-3 text-right">Stock Value</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {sup.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{item.inventory.name}</td>
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{item.inventory.itemCode}</td>
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{item.batchNo}</td>
                          <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">{formatDate(item.expiryDate)}</td>
                          <td className="px-4 py-3.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{item.availableQty} {item.inventory.unit}</td>
                          <td className="px-4 py-3.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(item.stockValue)}</td>
                          <td className="px-4 py-3.5">
                            {item.status === "EXPIRED" ? (
                              <span className="px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/40 rounded-full">EXPIRED</span>
                            ) : (
                              <span className="px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-full">{item.daysRemaining}d remaining</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
