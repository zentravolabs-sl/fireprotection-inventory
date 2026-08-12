"use client";

// ============================================================
// src/components/projects/ProjectStatusBadge.tsx
// Color-coded ERP Status Badges
// ============================================================

import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function ProjectStatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case "PENDING":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" }; // Amber
      case "MATERIAL_REQUEST":
        return { bg: "#e0f2fe", text: "#075985", border: "#bae6fd" }; // Sky Blue
      case "MATERIAL_APPROVED":
        return { bg: "#ddd6fe", text: "#5b21b6", border: "#c4b5fd" }; // Purple
      case "MATERIAL_ISSUED":
      case "ISSUED":
        return { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" }; // Blue
      case "IN_PROGRESS":
        return { bg: "#ccfbf1", text: "#115e59", border: "#99f6e4" }; // Teal
      case "COMPLETED":
      case "APPROVED":
      case "GOOD":
        return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" }; // Green
      case "CANCELLED":
      case "REJECTED":
      case "SCRAP":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" }; // Red
      case "DAMAGED":
      case "PARTIAL":
      case "PARTIALLY_RETURNED":
        return { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" }; // Orange
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" }; // Gray
    }
  };

  const style = getBadgeStyle(status);
  const formattedText = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[155px] px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-center ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
        style={{ backgroundColor: style.text }}
      />
      {formattedText}
    </span>
  );
}
