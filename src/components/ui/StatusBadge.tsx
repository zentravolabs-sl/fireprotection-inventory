"use client";

// ============================================================
// src/components/ui/StatusBadge.tsx
// Color-coded badge component for ERP statuses & movement types.
// ============================================================

import React from "react";

type BadgeType =
  | "DRAFT"
  | "CONFIRMED"
  | "CANCELLED"
  | "IN"
  | "OUT"
  | "RETURN"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "AVAILABLE"
  | "USED"
  | "SCRAPPED"
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | string;

interface StatusBadgeProps {
  status: BadgeType;
  label?: string;
  size?: "sm" | "md";
}

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // StockReceiveStatus
  DRAFT: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  CONFIRMED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  CANCELLED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },

  // MovementType
  IN: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  OUT: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
  RETURN: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  TRANSFER: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  ADJUSTMENT: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },

  // PipeCutStatus
  AVAILABLE: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  USED: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" },
  SCRAPPED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },

  // Inventory Stock status
  IN_STOCK: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  LOW_STOCK: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  OUT_OF_STOCK: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
};

export default function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const style = BADGE_STYLES[status] || {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  };

  const textLabel = label || status.replace(/_/g, " ");

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {textLabel}
    </span>
  );
}
