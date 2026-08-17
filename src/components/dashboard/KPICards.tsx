"use client";

// ============================================================
// src/components/dashboard/KPICards.tsx
// Responsive grid of 8 KPI metrics for the Main Dashboard.
// ============================================================

import React from "react";
import {
  Briefcase,
  Activity,
  Users,
  UserCheck,
  Package,
  AlertTriangle,
  Clock,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { DashboardKPIs } from "@/lib/services/dashboardService";

interface KPICardsProps {
  kpis: DashboardKPIs;
}

function formatLKRShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `LKR ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `LKR ${(amount / 1_000).toFixed(0)}K`;
  }
  return `LKR ${amount.toLocaleString()}`;
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      label: "Total Projects",
      value: kpis.totalProjects,
      subtitle: "+12% from last month",
      icon: <Briefcase size={20} className="text-blue-500" />,
      bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Active Projects",
      value: kpis.activeProjects,
      subtitle: `${kpis.activeProjectsPercentage}% of total projects`,
      icon: <Activity size={20} className="text-emerald-500" />,
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Total Clients",
      value: kpis.totalClients,
      subtitle: `+${kpis.newClientsThisMonth} new this month`,
      icon: <Users size={20} className="text-indigo-500" />,
      bg: "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40",
      textColor: "text-indigo-700 dark:text-indigo-300",
    },
    {
      label: "Total Employees",
      value: kpis.totalEmployees,
      subtitle: `${kpis.activeEmployees} active accounts`,
      icon: <UserCheck size={20} className="text-cyan-500" />,
      bg: "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/40",
      textColor: "text-cyan-700 dark:text-cyan-300",
    },
    {
      label: "Inventory Items",
      value: kpis.totalInventoryItems,
      subtitle: `${kpis.totalAvailableStock.toLocaleString()} total units`,
      icon: <Package size={20} className="text-purple-500" />,
      bg: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40",
      textColor: "text-purple-700 dark:text-purple-300",
    },
    {
      label: "Low Stock Items",
      value: kpis.lowStockCount,
      subtitle: kpis.lowStockCount > 0 ? "Requires reordering" : "Stock healthy",
      icon: <AlertTriangle size={20} className={kpis.lowStockCount > 0 ? "text-amber-500" : "text-gray-400"} />,
      bg: kpis.lowStockCount > 0
        ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900"
        : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800",
      textColor: kpis.lowStockCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300",
    },
    {
      label: "Pending Approvals",
      value: kpis.pendingApprovalsCount,
      subtitle: kpis.pendingApprovalsCount > 0 ? "Action required" : "All cleared",
      icon: <Clock size={20} className={kpis.pendingApprovalsCount > 0 ? "text-red-500 animate-pulse" : "text-gray-400"} />,
      bg: kpis.pendingApprovalsCount > 0
        ? "bg-red-50/70 dark:bg-red-950/40 border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-900"
        : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800",
      textColor: kpis.pendingApprovalsCount > 0 ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300",
    },
    {
      label: "Outstanding Payments",
      value: formatLKRShort(kpis.outstandingPaymentsAmount),
      subtitle: "Pending receivables",
      icon: <CreditCard size={20} className="text-teal-500" />,
      bg: "bg-teal-50/50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40",
      textColor: "text-teal-700 dark:text-teal-300",
      isFormattedString: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${card.bg}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {card.label}
            </span>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-xs">
              {card.icon}
            </div>
          </div>

          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${card.textColor}`}>
              {card.isFormattedString ? card.value : Number(card.value).toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp size={11} className="text-gray-400" />
              {card.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
