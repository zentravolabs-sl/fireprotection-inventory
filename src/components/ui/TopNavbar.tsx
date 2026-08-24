"use client";

// ============================================================
// src/components/ui/TopNavbar.tsx
// Persistent top navbar rendered inside the main content area
// (inside SidebarOffsetWrapper) on every protected page.
// Shows the current page title, user role badge, logout,
// and the live in-app NotificationBell.
// ============================================================

import React from "react";
import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface TopNavbarProps {
  userName: string;
  userEmail: string;
  userRole?: string;
}

// Maps pathname prefixes to human-readable section titles
function getPageTitle(pathname: string): string {
  const routes: [string, string][] = [
    ["/projects",          "Projects"],
    ["/material-requests", "Material Requests"],
    ["/project-stock",     "Project Stock"],
    ["/transfers",         "Project Transfers"],
    ["/reports",           "Reports"],
    ["/users-roles",       "Users & Roles"],
    ["/audit-log",         "Audit Log"],
    ["/quotations",        "Quotations"],
    ["/categories",        "Categories"],
    ["/sub-categories",    "Sub-Categories"],
    ["/inventory",         "Inventory Master"],
    ["/stock-receive",     "Stock Receive"],
    ["/stock-batch",       "Stock Batches"],
    ["/stock-movement",    "Stock Movements"],
    ["/pipe-cut-pieces",   "Pipe & Cut Pieces"],
    ["/tools",             "Tools"],
    ["/suppliers",         "Suppliers"],
    ["/customers",         "Customers"],
    ["/labour-types",      "Labour Types"],
    ["/labour",            "Labour Master"],
    ["/expiry",            "Expiry Management"],
    ["/dashboard",         "Dashboard"],
    ["/admin",             "Admin Panel"],
    ["/super-admin",       "Super Admin"],
  ];

  for (const [prefix, label] of routes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return label;
    }
  }
  return "FireGuard ERP";
}

const roleStyles: Record<string, string> = {
  SUPER_ADMIN:
    "bg-purple-900/40 text-purple-300 border border-purple-700/40",
  ADMIN:
    "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  CEO:
    "bg-rose-900/40 text-rose-300 border border-rose-700/40",
  GENERAL_MANAGER:
    "bg-orange-900/40 text-orange-300 border border-orange-700/40",
  PROJECT_MANAGER:
    "bg-green-900/40 text-green-300 border border-green-700/40",
  QS_ENGINEER:
    "bg-teal-900/40 text-teal-300 border border-teal-700/40",
  PURCHASE_ENGINEER:
    "bg-indigo-900/40 text-indigo-300 border border-indigo-700/40",
  INVENTORY_CONTROLLER:
    "bg-sky-900/40 text-sky-300 border border-sky-700/40",
  ENGINEER:
    "bg-cyan-900/40 text-cyan-300 border border-cyan-700/40",
  ACCOUNTANT:
    "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  USER:
    "bg-[#1e2a3d] text-[#dce3ef] border border-[#1e2535]",
};

export function TopNavbar({ userName, userEmail, userRole }: TopNavbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const role = userRole ?? "USER";
  const roleBadgeClass = roleStyles[role] ?? roleStyles.USER;

  return (
    <header className="app-topnav">
      {/* Left — Page title */}
      <div className="app-topnav-title">
        <h1 className="app-topnav-heading">{pageTitle}</h1>
      </div>

      {/* Right — User info + actions */}
      <div className="app-topnav-actions">
        {/* Live notification bell — replaces static placeholder */}
        <NotificationBell />

        {/* Role badge */}
        <span
          className={`app-topnav-role ${roleBadgeClass}`}
          title={userEmail}
        >
          <Shield size={11} />
          {role.replace(/_/g, " ")}
        </span>

        {/* User name */}
        <span className="app-topnav-username" title={userEmail}>
          {userName}
        </span>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="app-topnav-logout"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
