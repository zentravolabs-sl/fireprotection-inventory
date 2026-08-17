"use client";

// ============================================================
// src/components/dashboard/project-manager/PMQuickActionsWidget.tsx
// Quick Operational Shortcuts for Project Manager.
// ============================================================

import React from "react";
import Link from "next/link";
import { PlusCircle, PackagePlus, UserPlus, AlertCircle, TrendingUp } from "lucide-react";

export function PMQuickActionsWidget() {
  const actions = [
    { label: "+ Add Project", href: "/projects", icon: <PlusCircle size={16} /> },
    { label: "+ Material Request", href: "/material-requests", icon: <PackagePlus size={16} /> },
    { label: "Assign Engineer", href: "/users-roles", icon: <UserPlus size={16} /> },
    { label: "Report Issue", href: "/projects", icon: <AlertCircle size={16} /> },
    { label: "Update Progress", href: "/projects", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Quick Operational Actions
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
