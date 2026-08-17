"use client";

// ============================================================
// src/components/dashboard/InventoryOverviewWidget.tsx
// Inventory Summary Widget displaying stock availability & warnings.
// ============================================================

import React from "react";
import Link from "next/link";
import { Package, AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { InventoryOverviewSummary } from "@/lib/services/dashboardService";

interface InventoryOverviewWidgetProps {
  summary: InventoryOverviewSummary;
}

export function InventoryOverviewWidget({ summary }: InventoryOverviewWidgetProps) {
  const total = summary.totalItems || 1;
  const availPercent = Math.round((summary.availableItems / total) * 100);
  const lowPercent = Math.round((summary.lowStockItems / total) * 100);
  const outPercent = Math.round((summary.outOfStockItems / total) * 100);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Package size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Inventory Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Stock health & warehouse thresholds
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            View Inventory <ArrowRight size={12} />
          </Link>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl">
            <span className="text-xs font-semibold text-gray-500">Total Items</span>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {summary.totalItems.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Available Stock</span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {summary.availableItems.toLocaleString()}
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            summary.lowStockItems > 0
              ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${summary.lowStockItems > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-500"}`}>
                Low Stock
              </span>
              {summary.lowStockItems > 0 && <AlertTriangle size={14} className="text-amber-500" />}
            </div>
            <p className={`text-2xl font-black mt-0.5 ${summary.lowStockItems > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-gray-100"}`}>
              {summary.lowStockItems}
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            summary.outOfStockItems > 0
              ? "bg-red-50/70 dark:bg-red-950/40 border-red-300 dark:border-red-700"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${summary.outOfStockItems > 0 ? "text-red-700 dark:text-red-300" : "text-gray-500"}`}>
                Out of Stock
              </span>
              {summary.outOfStockItems > 0 && <AlertCircle size={14} className="text-red-500" />}
            </div>
            <p className={`text-2xl font-black mt-0.5 ${summary.outOfStockItems > 0 ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}>
              {summary.outOfStockItems}
            </p>
          </div>
        </div>

        {/* Visual Progress Bar Breakdown */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
            <span>Stock Ratio</span>
            <span>{availPercent}% Available</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${availPercent}%` }} title="Available" />
            <div className="bg-amber-500 h-full" style={{ width: `${lowPercent}%` }} title="Low Stock" />
            <div className="bg-red-500 h-full" style={{ width: `${outPercent}%` }} title="Out of Stock" />
          </div>
        </div>
      </div>
    </div>
  );
}
