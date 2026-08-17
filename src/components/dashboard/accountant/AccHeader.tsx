"use client";

// ============================================================
// src/components/dashboard/accountant/AccHeader.tsx
// Header Bar for the Accountant Finance Dashboard.
// Includes Search, Notifications, Profile, Role badge, and Date-Range Selector.
// ============================================================

import React from "react";
import { Search, DollarSign, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface AccHeaderProps {
  userName: string;
  userEmail: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  periodFilter: string;
  onPeriodChange: (p: string) => void;
}

export function AccHeader({
  userName,
  userEmail,
  searchQuery,
  onSearchChange,
  periodFilter,
  onPeriodChange,
}: AccHeaderProps) {
  const periods = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Finance Dashboard
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <DollarSign size={12} />
            ACCOUNTANT
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor revenue, expenses, payments and financial performance
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Date Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold">
          <Calendar size={14} className="text-gray-400 ml-2 mr-1" />
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                periodFilter === p.value
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:w-56">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search invoices, payments..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-900"
          />
        </div>

        <div className="p-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <NotificationBell />
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-xs text-emerald-800 dark:text-emerald-300">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {userName}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight truncate max-w-[110px]">
              {userEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
