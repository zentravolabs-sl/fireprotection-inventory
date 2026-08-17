"use client";

// ============================================================
// src/components/dashboard/engineer/EngQuickActionsWidget.tsx
// Quick Technical Shortcuts for Engineer.
// ============================================================

import React from "react";
import Link from "next/link";
import { Play, CheckCircle, PackagePlus, AlertCircle, ShieldCheck, TrendingUp } from "lucide-react";

export function EngQuickActionsWidget() {
  const actions = [
    { label: "Start Task", href: "/projects", icon: <Play size={16} /> },
    { label: "Complete Task", href: "/projects", icon: <CheckCircle size={16} /> },
    { label: "Create Material Request", href: "/material-requests", icon: <PackagePlus size={16} /> },
    { label: "Report Site Issue", href: "/projects", icon: <AlertCircle size={16} /> },
    { label: "Record Inspection", href: "/projects", icon: <ShieldCheck size={16} /> },
    { label: "Update Progress", href: "/projects", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Quick Actions & Workflows
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((act) => (
          <Link
            key={act.label}
            href={act.href}
            className="px-3.5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            {act.icon}
            {act.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
