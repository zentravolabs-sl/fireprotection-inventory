"use client";

// ============================================================
// src/components/dashboard/RecentActivitiesTimeline.tsx
// Vertical audit activity log timeline.
// ============================================================

import React from "react";
import Link from "next/link";
import { Activity, Briefcase, Package, DollarSign, UserCheck, Shield } from "lucide-react";
import { RecentActivityItem } from "@/lib/services/dashboardService";

interface RecentActivitiesTimelineProps {
  activities: RecentActivityItem[];
}

export function RecentActivitiesTimeline({ activities }: RecentActivitiesTimelineProps) {
  const getCategoryIcon = (category: RecentActivityItem["category"]) => {
    switch (category) {
      case "PROJECT":
        return <Briefcase size={14} className="text-blue-500" />;
      case "INVENTORY":
        return <Package size={14} className="text-purple-500" />;
      case "FINANCE":
        return <DollarSign size={14} className="text-amber-500" />;
      case "USER":
        return <UserCheck size={14} className="text-cyan-500" />;
      default:
        return <Activity size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Activity size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Recent Activity Log
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time operational audit timeline
              </p>
            </div>
          </div>
          <Link
            href="/audit-log"
            className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline"
          >
            Full Audit Log →
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            No system activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
            {activities.map((item) => (
              <div key={item.id} className="relative flex items-start justify-between gap-3 text-xs">
                {/* Bullet Icon */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xs">
                  {getCategoryIcon(item.category)}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    {item.action}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      by {item.userName}
                    </span>
                    {item.userRole && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {item.userRole}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                  {item.timeAgo}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
