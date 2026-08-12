"use client";

// ============================================================
// src/components/ui/FormButton.tsx
// Reusable submit button with loading state and spinner.
// ============================================================

import React from "react";
import { Loader2 } from "lucide-react";

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  /** Visual variant */
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export default function FormButton({
  children,
  loading = false,
  loadingText = "Please wait...",
  variant = "primary",
  fullWidth = true,
  disabled,
  className,
  ...props
}: FormButtonProps) {
  const isDisabled = disabled || loading;

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 py-3 px-6 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none whitespace-nowrap";

  const variantClasses = {
    primary:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-300 disabled:opacity-60 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed",
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        baseClasses,
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { FormButton };
