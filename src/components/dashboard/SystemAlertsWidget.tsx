"use client";

// ============================================================
// src/components/dashboard/SystemAlertsWidget.tsx
// System Alerts Card displaying critical operational notices.
// ============================================================

import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { SystemAlertItem } from "@/lib/services/dashboardService";

interface SystemAlertsWidgetProps {
  alerts: SystemAlertItem[];
}

export function SystemAlertsWidget({ alerts }: SystemAlertsWidgetProps) {
  const getAlertStyle = (type: SystemAlertItem["type"]) => {
    switch (type) {
      case "DANGER":
        return {
          bg: "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200",
          icon: <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />,
          badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        };
      case "WARNING":
        return {
          bg: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200",
          icon: <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />,
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        };
      default:
        return {
          bg: "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200",
          icon: <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />,
          badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                System Alerts & Notices
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Active warnings, overdue targets, & threshold triggers
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((item) => {
            const style = getAlertStyle(item.type);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all hover:shadow-xs group ${style.bg}`}
              >
                <div className="flex items-start gap-3">
                  {style.icon}
                  <div>
                    <h4 className="text-xs font-bold leading-tight group-hover:underline">
                      {item.title}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-bold underline flex items-center gap-0.5">
                    View <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
