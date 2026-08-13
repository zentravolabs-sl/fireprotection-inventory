"use client";

// ============================================================
// src/app/(Main)/expiry/page.tsx
// Main Expiry Management Dashboard Page.
// Displays executive summary cards, status filters, data table, and batch details.
// ============================================================

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  HelpCircle,
  Filter,
  Search,
  RotateCcw,
  Calendar as CalendarIcon,
  FileText,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Building2,
  Settings,
} from "lucide-react";
import {
  getExpiryDashboardAction,
  getExpiryBatchesAction,
  updateExpiryThresholdSettingAction,
  triggerExpiryCheckAction,
} from "./actions";
import BatchDetailsModal from "@/components/expiry/BatchDetailsModal";
import type { ExpiryBatchDetail, ExpiryDashboardSummary } from "@/lib/services/expiryService";

export const dynamic = "force-dynamic";

export default function ExpiryManagementPage() {
  const [dashboard, setDashboard] = useState<ExpiryDashboardSummary | null>(null);
  const [batchesData, setBatchesData] = useState<{
    items: ExpiryBatchDetail[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>({ items: [], totalCount: 0, totalPages: 1, currentPage: 1 });

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Selected Batch for Details Modal
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [thresholdDays, setThresholdDays] = useState<number>(30);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // System Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newThreshold, setNewThreshold] = useState<number>(30);

  const loadData = () => {
    setLoading(true);
    startTransition(async () => {
      const [dashRes, batchRes] = await Promise.all([
        getExpiryDashboardAction(thresholdDays),
        getExpiryBatchesAction({
          status: statusFilter === "ALL" ? undefined : (statusFilter as any),
          expiryRange: String(thresholdDays) as any,
          search: search || undefined,
          page,
          limit: 12,
        }),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboard(dashRes.data);
        setNewThreshold(dashRes.data.thresholdDays);
      }

      if (batchRes.success && batchRes.data) {
        setBatchesData(batchRes.data);
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, thresholdDays, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setPage(1);
  };

  const handleUpdateThreshold = async () => {
    const res = await updateExpiryThresholdSettingAction({ thresholdDays: newThreshold });
    if (res.success) {
      setThresholdDays(newThreshold);
      setShowSettingsModal(false);
      loadData();
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* â”€â”€ Page Header â”€â”€ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Clock size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Expiry Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 pl-10">
            Monitor expired stock, upcoming expirations, FEFO batch allocation & stock valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <Settings size={14} /> Threshold ({thresholdDays}d)
          </button>

          <Link
            href="/expiry/calendar"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <CalendarIcon size={14} /> Calendar
          </Link>

          <Link
            href="/expiry/reports"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
          >
            <FileText size={14} /> Expiry Reports
          </Link>
        </div>
      </div>

      {/* â”€â”€ Summary Metric Cards â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Expired Card */}
        <div
          onClick={() => setStatusFilter("EXPIRED")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "EXPIRED"
              ? "bg-red-50/80 border-red-300 ring-2 ring-red-500/20"
              : "bg-white border-gray-200/80 hover:border-red-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Expired</span>
            <span className="p-2 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {dashboard ? dashboard.expiredBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-red-600 mt-2 truncate">
            {formatCurrency(dashboard?.expiredStockValue || 0)}
          </p>
        </div>

        {/* Expiring <= 7 Days */}
        <div
          onClick={() => setStatusFilter("EXPIRING_SOON")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "EXPIRING_SOON"
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
              : "bg-white border-gray-200/80 hover:border-amber-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider">Expiring $\le$ 7 Days</span>
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {dashboard ? dashboard.expiring7DaysCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-amber-600 mt-2 truncate">
            {formatCurrency(dashboard?.expiring7DaysValue || 0)}
          </p>
        </div>

        {/* Expiring <= 30 Days */}
        <div
          onClick={() => setStatusFilter("EXPIRING_SOON")}
          className="p-5 bg-white border border-gray-200/80 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider">Expiring $\le$ {thresholdDays} Days</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {dashboard ? dashboard.expiring30DaysCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-amber-600 mt-2 truncate">
            {formatCurrency(dashboard?.expiring30DaysValue || 0)}
          </p>
        </div>

        {/* Valid */}
        <div
          onClick={() => setStatusFilter("VALID")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "VALID"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-gray-200/80 hover:border-emerald-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">Valid Stock</span>
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {dashboard ? dashboard.validBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-emerald-600 mt-2 truncate">
            {formatCurrency(dashboard?.validStockValue || 0)}
          </p>
        </div>

        {/* No Expiry */}
        <div
          onClick={() => setStatusFilter("NO_EXPIRY")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "NO_EXPIRY"
              ? "bg-gray-100 border-gray-400 ring-2 ring-gray-400/20"
              : "bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">No Expiry</span>
            <span className="p-2 bg-gray-100 text-gray-600 rounded-xl">
              <HelpCircle size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tabular-nums">
              {dashboard ? dashboard.noExpiryBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-gray-600 mt-2 truncate">
            {formatCurrency(dashboard?.noExpiryStockValue || 0)}
          </p>
        </div>
      </div>

      {/* â”€â”€ Filter Bar & Actions â”€â”€ */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: "ALL", label: "All Stock" },
            { id: "EXPIRED", label: "Expired Only" },
            { id: "EXPIRING_SOON", label: "Expiring Soon" },
            { id: "VALID", label: "Valid" },
            { id: "NO_EXPIRY", label: "No Expiry" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Window Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search item, batch, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </form>

          <select
            value={thresholdDays}
            onChange={(e) => setThresholdDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none font-semibold text-gray-700"
          >
            <option value={7}>Alert Threshold: 7 Days</option>
            <option value={14}>Alert Threshold: 14 Days</option>
            <option value={30}>Alert Threshold: 30 Days</option>
            <option value={60}>Alert Threshold: 60 Days</option>
            <option value={90}>Alert Threshold: 90 Days</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* â”€â”€ Expiry Data Table â”€â”€ */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Item Master</th>
                <th className="py-3.5 px-4">Item Code</th>
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Mfg Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-right">Available Qty</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Stock Value</th>
                <th className="py-3.5 px-4">Expiry Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400">
                    Loading inventory expiry records...
                  </td>
                </tr>
              ) : batchesData.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400">
                    No inventory batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                batchesData.items.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      row.status === "EXPIRED" ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{row.inventory.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {row.inventory.category.categoryName} â€” {row.inventory.subCategory.name}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                      {row.inventory.itemCode}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {row.batchNo}
                    </td>

                    <td className="py-3 px-4 text-gray-700 truncate max-w-[140px]">
                      {row.supplier?.company || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatDate(row.receiveDate)}
                    </td>

                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatDate(row.manufactureDate)}
                    </td>

                    <td className="py-3 px-4 font-bold whitespace-nowrap">
                      {formatDate(row.expiryDate)}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900">
                      {row.availableQty} {row.inventory.unit}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-gray-600">
                      LKR {row.unitCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900">
                      LKR {row.stockValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold text-red-700 bg-red-100 border border-red-200 rounded-full">
                          <ShieldAlert size={12} /> EXPIRED
                        </span>
                      )}
                      {row.status === "EXPIRING_SOON" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">
                          <Clock size={12} /> {row.daysRemaining}d remaining
                        </span>
                      )}
                      {row.status === "VALID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full">
                          VALID
                        </span>
                      )}
                      {row.status === "NO_EXPIRY" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-full">
                          NO EXPIRY
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBatchId(row.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors"
                        title="View Batch History Ledger"
                      >
                        <Eye size={13} /> View Batch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200 text-xs">
          <span className="text-gray-500 font-medium">
            Showing Page <span className="font-bold text-gray-900">{batchesData.currentPage}</span> of{" "}
            <span className="font-bold text-gray-900">{batchesData.totalPages}</span> ({batchesData.totalCount} total batches)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(batchesData.totalPages, p + 1))}
              disabled={page >= batchesData.totalPages}
              className="p-1.5 text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatchId && (
        <BatchDetailsModal
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
        />
      )}

      {/* Threshold Setting Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Configure System Expiry Alert Window</h3>
            <p className="text-xs text-gray-500">
              Select the alert threshold window for defining "EXPIRING SOON" stock across the ERP system.
            </p>

            <div className="space-y-2">
              {[7, 14, 30, 60, 90].map((days) => (
                <label
                  key={days}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    newThreshold === days
                      ? "bg-red-50 border-red-300 font-bold text-red-700"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  <span className="text-xs font-semibold">{days} Days Alert Window</span>
                  <input
                    type="radio"
                    name="threshold"
                    checked={newThreshold === days}
                    onChange={() => setNewThreshold(days)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateThreshold}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Save Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
