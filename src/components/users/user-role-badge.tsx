// ============================================================
// src/components/users/user-role-badge.tsx
// Color-coded badge for each user role.
// ============================================================

import React from "react";
import type { UserRole } from "@/types/auth";

interface UserRoleBadgeProps {
  role: UserRole | string;
  size?: "sm" | "md";
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    dot: "bg-purple-400",
  },
  ADMIN: {
    label: "Admin",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  CEO: {
    label: "CEO",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
  GENERAL_MANAGER: {
    label: "General Manager",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    dot: "bg-orange-400",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  QS_ENGINEER: {
    label: "QS Engineer",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
    dot: "bg-teal-400",
  },
  PURCHASE_ENGINEER: {
    label: "Purchase Engineer",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    dot: "bg-indigo-400",
  },
  INVENTORY_CONTROLLER: {
    label: "Inventory Controller",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
    dot: "bg-sky-400",
  },
  ENGINEER: {
    label: "Engineer",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  ACCOUNTANT: {
    label: "Accountant",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  USER: {
    label: "User",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const DEFAULT_CONFIG = {
  label: "Unknown",
  bg: "bg-slate-500/10",
  text: "text-slate-400",
  border: "border-slate-500/20",
  dot: "bg-slate-400",
};

export default function UserRoleBadge({ role, size = "md" }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? DEFAULT_CONFIG;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
