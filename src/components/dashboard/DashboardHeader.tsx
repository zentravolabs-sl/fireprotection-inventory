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
    </div>
  );
}
