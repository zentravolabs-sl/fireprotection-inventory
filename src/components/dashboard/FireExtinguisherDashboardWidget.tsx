"use client";

// ============================================================
// src/components/dashboard/FireExtinguisherDashboardWidget.tsx
// Dashboard Widget for Fire Extinguisher Management
// ============================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  CheckCircle,
  Truck,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Plus,
  Box,
} from "lucide-react";
import { getFireExtinguisherDashboardStatsAction } from "@/app/actions/fire-extinguishers";

export function FireExtinguisherDashboardWidget() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const res = await getFireExtinguisherDashboardStatsAction();
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Fire Extinguisher Management
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Unit tracking, refill status, client deliveries, and active site deployment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/fire-extinguishers/deliveries"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Truck size={14} /> Deliveries
          </Link>
          <Link
            href="/fire-extinguishers/assignments"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link href="/fire-extinguishers/units?status=AVAILABLE" className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Available</div>
          <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1">{stats.availableCount}</div>
        </Link>

        <Link href="/fire-extinguishers/assignments?tab=PROJECTS" className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Project Sites</div>
          <div className="text-xl font-black text-blue-900 dark:text-blue-200 mt-1">{stats.assignedProjectCount}</div>
        </Link>

        <Link href="/fire-extinguishers/assignments?tab=CUSTOMERS" className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-950/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">Direct Clients</div>
          <div className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-1">{stats.assignedCustomerCount}</div>
        </Link>

        <Link href="/fire-extinguishers/refills?tab=UNDER_REFILL" className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Under Refill</div>
          <div className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">{stats.underRefillCount}</div>
        </Link>

        <Link href="/fire-extinguishers/units?status=TEMPORARY_REPLACEMENT" className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-950/60 bg-purple-50/50 dark:bg-purple-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">Temp Replacements</div>
          <div className="text-xl font-black text-purple-900 dark:text-purple-200 mt-1">{stats.tempReplacementCount}</div>
        </Link>

        <Link href="/fire-extinguishers/units" className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 hover:scale-[1.02] transition-transform">
          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Expiring / Alert</div>
          <div className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">{stats.expiringSoonCount}</div>
        </Link>
      </div>
    </div>
  );
}
