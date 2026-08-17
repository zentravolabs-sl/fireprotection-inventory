"use client";

// ============================================================
// src/components/dashboard/PendingActionsWidget.tsx
// Prominent Pending Actions queue highlighting items needing Admin review.
// ============================================================

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, BellRing } from "lucide-react";
import { PendingActionItem } from "@/lib/services/dashboardService";

interface PendingActionsWidgetProps {
  actions: PendingActionItem[];
}

export function PendingActionsWidget({ actions }: PendingActionsWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <BellRing size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Pending Actions Needed
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Items requiring your immediate review or authorization
              </p>
            </div>
          </div>
          {actions.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
              {actions.reduce((s, a) => s + a.count, 0)} Pending
            </span>
          )}
        </div>

        {actions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              You&apos;re all caught up!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              There are currently no pending approvals or stock alerts requiring Admin intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-gray-200 dark:border-gray-700/80 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-xs shrink-0">
                    {item.count}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                    Review <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
