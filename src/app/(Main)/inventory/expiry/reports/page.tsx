"use client";

// ============================================================
// src/app/(Main)/inventory/expiry/reports/page.tsx
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
import {
  getExpiryReportAction,
  getSupplierExpiryReportAction,
} from "../actions";
import type { ExpiryBatchDetail, SupplierExpirySummary } from "@/lib/services/expiryService";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <Link
            href="/inventory/expiry"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Expiry Management
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Inventory Expiry Reports
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Comprehensive audit reports for stock valuation, upcoming expirations & supplier analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "STOCK"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText size={15} /> Expiry Stock Report
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIER")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "SUPPLIER"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building2 size={15} /> Supplier Expiry Report
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "STOCK" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="EXPIRED">EXPIRED Only</option>
              <option value="EXPIRING_SOON">EXPIRING SOON Only</option>
              <option value="VALID">VALID Only</option>
              <option value="NO_EXPIRY">NO EXPIRY</option>
            </select>
          )}

          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none"
          >
            <option value="7">Window: 7 Days</option>
            <option value="14">Window: 14 Days</option>
            <option value="30">Window: 30 Days</option>
            <option value="60">Window: 60 Days</option>
            <option value="90">Window: 90 Days</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Expiry Stock Report */}
      {activeTab === "STOCK" && (
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-700">
            <span>Total Batches: {stockReport.totalItemsCount}</span>
            <span>Total Stock Quantity: {stockReport.totalQty}</span>
            <span className="text-sm font-black text-gray-900">
              Total Stock Value: {formatCurrency(stockReport.totalValue)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-extrabold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Receive Date</th>
                  <th className="py-3 px-4">Mfg Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Stock Value</th>
                  <th className="py-3 px-4 text-center">Days Remaining</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-gray-400">
                      Loading expiry report...
                    </td>
                  </tr>
                ) : stockReport.items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-gray-400">
                      No batch records found for this report filter.
                    </td>
                  </tr>
                ) : (
                  stockReport.items.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {row.inventory.name}
                        <span className="block text-[10px] font-mono text-gray-500 font-normal">
                          {row.inventory.itemCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {row.inventory.category.categoryName}
                      </td>
                      <td className="py-3 px-4 text-gray-700 truncate max-w-[130px]">
                        {row.supplier?.company || "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {row.batchNo}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(row.receiveDate)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(row.manufactureDate)}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{formatDate(row.expiryDate)}</td>
                      <td className="py-3 px-4 text-right font-black tabular-nums">
                        {row.availableQty} {row.inventory.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-600 tabular-nums">
                        LKR {row.unitCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 tabular-nums">
                        {formatCurrency(row.stockValue)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {row.daysRemaining !== null ? `${row.daysRemaining}d` : "--"}
                      </td>
                      <td className="py-3 px-4">
                        {row.status === "EXPIRED" && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-200 rounded-full">
                            EXPIRED
                          </span>
                        )}
                        {row.status === "EXPIRING_SOON" && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">
                            EXPIRING SOON
                          </span>
                        )}
                        {row.status === "VALID" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">
                            VALID
                          </span>
                        )}
                        {row.status === "NO_EXPIRY" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-full">
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
            <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-200">
              Loading supplier expiry analysis...
            </div>
          ) : supplierReport.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-200">
              No expiring or expired batches associated with suppliers under the current threshold.
            </div>
          ) : (
            supplierReport.map((sup) => (
              <div key={sup.supplierId} className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden space-y-3">
                <div className="p-4 bg-gray-900 text-white flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Building2 size={18} className="text-red-400" /> {sup.company}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
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

                <div className="p-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Batch No</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                        <th className="py-2.5 px-3 text-right">Available Qty</th>
                        <th className="py-2.5 px-3 text-right">Stock Value</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sup.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-bold text-gray-900">{item.inventory.name}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-600">{item.inventory.itemCode}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{item.batchNo}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">{formatDate(item.expiryDate)}</td>
                          <td className="py-2.5 px-3 text-right font-black tabular-nums">{item.availableQty} {item.inventory.unit}</td>
                          <td className="py-2.5 px-3 text-right font-black tabular-nums">{formatCurrency(item.stockValue)}</td>
                          <td className="py-2.5 px-3">
                            {item.status === "EXPIRED" ? (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold text-red-700 bg-red-100 rounded-full">EXPIRED</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-100 rounded-full">{item.daysRemaining}d remaining</span>
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
