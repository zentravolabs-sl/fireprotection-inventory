// ============================================================
// src/components/users/user-status-badge.tsx
// Active / Inactive status badge for users.
// ============================================================

import React from "react";

interface UserStatusBadgeProps {
  isActive: boolean;
  size?: "sm" | "md";
}

export default function UserStatusBadge({ isActive, size = "md" }: UserStatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (isActive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold border rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full bg-rose-500/10 text-rose-400 border-rose-500/20 ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      Inactive
    </span>
  );
}
