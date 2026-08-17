"use client";

// ============================================================
// src/components/dashboard/DashboardHeader.tsx
// Header bar for Main Dashboard with search, notifications, & user role badge.
// ============================================================

import React from "react";
import { Search, Shield, UserCheck } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function DashboardHeader({
  userName,
  userEmail,
  userRole,
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
  const isSuper = userRole === "SUPER_ADMIN";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Dashboard
          </h1>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 ${isSuper
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
              }`}
          >
            <Shield size={11} />
            {userRole.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your fire protection operations & system metrics
        </p>
      </div>

      {/* Right Side: Global Search + Notifications + User Profile */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Global Search Bar */}
        <div className="relative flex-1 sm:w-64 md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects, clients, inventory..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            ⌘K
          </kbd>
        </div>

        {/* Live Notification Bell */}
        <div className="p-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <NotificationBell />
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-700 dark:text-gray-300">
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
