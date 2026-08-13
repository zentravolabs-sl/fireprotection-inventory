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
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0F1524] p-6 rounded-2xl border border-gray-200/80 dark:border-[#1e2a3d] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
              <Clock size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-[#dce3ef] tracking-tight">
              Expiry Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#5a657a] mt-1 pl-10">
            Monitor expired stock, upcoming expirations, FEFO batch allocation & stock valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-[#dce3ef] bg-gray-50 dark:bg-[#161d2e] hover:bg-gray-100 dark:hover:bg-[#1e2a3d] border border-gray-200 dark:border-[#1e2a3d] rounded-xl transition-colors"
          >
            <Settings size={14} /> Threshold ({thresholdDays}d)
          </button>

          <Link
            href="/expiry/calendar"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-[#dce3ef] bg-gray-50 dark:bg-[#161d2e] hover:bg-gray-100 dark:hover:bg-[#1e2a3d] border border-gray-200 dark:border-[#1e2a3d] rounded-xl transition-colors"
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

      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Expired Card */}
        <div
          onClick={() => setStatusFilter("EXPIRED")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "EXPIRED"
              ? "bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 ring-2 ring-red-500/20"
              : "bg-white dark:bg-[#0F1524] border-gray-200/80 dark:border-[#1e2a3d] hover:border-red-200 dark:hover:border-red-900/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">Expired</span>
            <span className="p-2 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldAlert size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
              {dashboard ? dashboard.expiredBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-[#5a657a] ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-2 truncate">
            {formatCurrency(dashboard?.expiredStockValue || 0)}
          </p>
        </div>

        {/* Expiring <= 7 Days */}
        <div
          onClick={() => setStatusFilter("EXPIRING_SOON")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "EXPIRING_SOON"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#0F1524] border-gray-200/80 dark:border-[#1e2a3d] hover:border-amber-200 dark:hover:border-amber-900/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Expiring &le; 7 Days</span>
            <span className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
              {dashboard ? dashboard.expiring7DaysCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-[#5a657a] ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {formatCurrency(dashboard?.expiring7DaysValue || 0)}
          </p>
        </div>

        {/* Expiring <= 30 Days */}
        <div
          onClick={() => setStatusFilter("EXPIRING_SOON")}
          className="p-5 bg-white dark:bg-[#0F1524] border border-gray-200/80 dark:border-[#1e2a3d] rounded-2xl hover:border-amber-200 dark:hover:border-amber-900/40 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Expiring &le; {thresholdDays} Days</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
              {dashboard ? dashboard.expiring30DaysCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-[#5a657a] ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {formatCurrency(dashboard?.expiring30DaysValue || 0)}
          </p>
        </div>

        {/* Valid */}
        <div
          onClick={() => setStatusFilter("VALID")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "VALID"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-[#0F1524] border-gray-200/80 dark:border-[#1e2a3d] hover:border-emerald-200 dark:hover:border-emerald-900/40 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Valid Stock</span>
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
              {dashboard ? dashboard.validBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-[#5a657a] ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatCurrency(dashboard?.validStockValue || 0)}
          </p>
        </div>

        {/* No Expiry */}
        <div
          onClick={() => setStatusFilter("NO_EXPIRY")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "NO_EXPIRY"
              ? "bg-gray-100 dark:bg-[#161d2e] border-gray-400 dark:border-gray-600 ring-2 ring-gray-400/20"
              : "bg-white dark:bg-[#0F1524] border-gray-200/80 dark:border-[#1e2a3d] hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-600 dark:text-gray-400 uppercase tracking-wider">No Expiry</span>
            <span className="p-2 bg-gray-100 dark:bg-[#161d2e] text-gray-600 dark:text-gray-400 rounded-xl">
              <HelpCircle size={18} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 dark:text-[#dce3ef] tabular-nums">
              {dashboard ? dashboard.noExpiryBatchesCount : 0}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-[#5a657a] ml-1.5">Batches</span>
          </div>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2 truncate">
            {formatCurrency(dashboard?.noExpiryStockValue || 0)}
          </p>
        </div>
      </div>

      {/* ── Filter Bar & Actions ── */}
      <div className="bg-white dark:bg-[#0F1524] p-4 rounded-2xl border border-gray-200/80 dark:border-[#1e2a3d] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                  ? "bg-gray-900 dark:bg-[#1e2a3d] text-white dark:text-[#dce3ef] shadow-sm"
                  : "bg-gray-100 dark:bg-[#161d2e] text-gray-600 dark:text-[#5a657a] hover:bg-gray-200 dark:hover:bg-[#1a2035]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Window Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search item, batch, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#161d2e] border border-gray-200 dark:border-[#1e2a3d] text-gray-900 dark:text-[#dce3ef] placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </form>

          <select
            value={thresholdDays}
            onChange={(e) => setThresholdDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#161d2e] border border-gray-200 dark:border-[#1e2a3d] rounded-xl outline-none font-semibold text-gray-700 dark:text-[#dce3ef]"
          >
            <option value={7}>Alert Threshold: 7 Days</option>
            <option value={14}>Alert Threshold: 14 Days</option>
            <option value={30}>Alert Threshold: 30 Days</option>
            <option value={60}>Alert Threshold: 60 Days</option>
            <option value={90}>Alert Threshold: 90 Days</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="p-2 text-gray-500 dark:text-[#5a657a] hover:text-gray-900 dark:hover:text-[#dce3ef] bg-gray-100 dark:bg-[#161d2e] hover:bg-gray-200 dark:hover:bg-[#1e2a3d] rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* ── Expiry Data Table ── */}
      <div className="bg-white dark:bg-[#0F1524] border border-gray-200/80 dark:border-[#1e2a3d] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/80 dark:bg-[#161d2e] border-b border-gray-200 dark:border-[#1e2a3d] text-gray-500 dark:text-[#5a657a] uppercase tracking-wider font-extrabold">
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
            <tbody className="divide-y divide-gray-100 dark:divide-[#1e2a3d] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    Loading inventory expiry records...
                  </td>
                </tr>
              ) : batchesData.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    No inventory batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                batchesData.items.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50/80 dark:hover:bg-[#161d2e]/50 transition-colors ${
                      row.status === "EXPIRED" ? "bg-red-50/30 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-[#dce3ef]">{row.inventory.name}</div>
                      <div className="text-[10px] text-gray-500 dark:text-[#5a657a]">
                        {row.inventory.category.categoryName} — {row.inventory.subCategory.name}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {row.inventory.itemCode}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-[#dce3ef]">
                      {row.batchNo}
                    </td>

                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                      {row.supplier?.company || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row.receiveDate)}
                    </td>

                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row.manufactureDate)}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-[#dce3ef] whitespace-nowrap">
                      {formatDate(row.expiryDate)}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900 dark:text-[#dce3ef]">
                      {row.availableQty} {row.inventory.unit}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-gray-600 dark:text-gray-400">
                      LKR {row.unitCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-black tabular-nums text-gray-900 dark:text-[#dce3ef]">
                      LKR {row.stockValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/40 rounded-full">
                          <ShieldAlert size={12} /> EXPIRED
                        </span>
                      )}
                      {row.status === "EXPIRING_SOON" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-full">
                          <Clock size={12} /> {row.daysRemaining}d remaining
                        </span>
                      )}
                      {row.status === "VALID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 rounded-full">
                          VALID
                        </span>
                      )}
                      {row.status === "NO_EXPIRY" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#161d2e] border border-gray-200 dark:border-[#1e2a3d] rounded-full">
                          NO EXPIRY
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBatchId(row.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-700 dark:text-[#dce3ef] bg-gray-100 dark:bg-[#161d2e] hover:bg-gray-200 dark:hover:bg-[#1e2a3d] border border-gray-200 dark:border-[#1e2a3d] rounded-lg transition-colors"
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
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 dark:bg-[#161d2e]/50 border-t border-gray-200 dark:border-[#1e2a3d] text-xs">
          <span className="text-gray-500 dark:text-[#5a657a] font-medium">
            Showing Page <span className="font-bold text-gray-900 dark:text-[#dce3ef]">{batchesData.currentPage}</span> of{" "}
            <span className="font-bold text-gray-900 dark:text-[#dce3ef]">{batchesData.totalPages}</span> ({batchesData.totalCount} total batches)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0F1524] hover:bg-gray-100 dark:hover:bg-[#161d2e] border border-gray-200 dark:border-[#1e2a3d] rounded-lg transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(batchesData.totalPages, p + 1))}
              disabled={page >= batchesData.totalPages}
              className="p-1.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0F1524] hover:bg-gray-100 dark:hover:bg-[#161d2e] border border-gray-200 dark:border-[#1e2a3d] rounded-lg transition-colors disabled:opacity-40"
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
          <div className="w-full max-w-md bg-white dark:bg-[#0F1524] p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-[#1e2a3d] space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-[#dce3ef]">Configure System Expiry Alert Window</h3>
            <p className="text-xs text-gray-500 dark:text-[#5a657a]">
              Select the alert threshold window for defining "EXPIRING SOON" stock across the ERP system.
            </p>

            <div className="space-y-2">
              {[7, 14, 30, 60, 90].map((days) => (
                <label
                  key={days}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    newThreshold === days
                      ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 font-bold text-red-700 dark:text-red-400"
                      : "bg-gray-50 dark:bg-[#161d2e] border-gray-200 dark:border-[#1e2a3d] text-gray-700 dark:text-[#dce3ef]"
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
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#161d2e] hover:bg-gray-200 dark:hover:bg-[#1e2a3d] rounded-xl"
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
