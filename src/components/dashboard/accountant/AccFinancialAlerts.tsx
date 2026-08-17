"use client";

// ============================================================
// src/components/dashboard/accountant/AccFinancialAlerts.tsx
// Financial Warning & Actionable Risk Alerts.
// ============================================================

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { FinancialAlertItem } from "@/lib/services/accountantDashboardService";

interface AccFinancialAlertsProps {
  alerts: FinancialAlertItem[];
}

export function AccFinancialAlerts({ alerts }: AccFinancialAlertsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Financial Alerts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              High-priority financial items requiring immediate attention
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl">
            ✓ No critical financial alerts. All accounts are in good standing!
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alt) => (
              <Link
                key={alt.id}
                href={alt.href}
                className="group flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors"
              >
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {alt.title}
                </span>
                <ArrowRight
                  size={14}
                  className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
