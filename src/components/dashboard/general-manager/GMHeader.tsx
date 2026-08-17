"use client";

// ============================================================
// src/components/dashboard/general-manager/GMHeader.tsx
// Executive Header for the General Manager Management Dashboard.
// ============================================================

import React from "react";
import { Search, Briefcase } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface GMHeaderProps {
  userName: string;
  userEmail: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function GMHeader({
  userName,
  userEmail,
  searchQuery,
  onSearchChange,
}: GMHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Management Dashboard
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <Briefcase size={12} />
            GENERAL MANAGER
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor overall business and project performance
        </p>
      </div>

      {/* Right Side: Search + Notifications + Profile */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 sm:w-64 md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects, clients, PMs..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-900"
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
