"use client";

// ============================================================
// src/components/ui/FormInput.tsx
// Reusable labelled form input with error state display.
// ============================================================

import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  /** If true, renders a password toggle button */
  isPassword?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, isPassword = false, id, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="mb-4">
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>

        <div className="relative">
          {/* Leading icon */}
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={[
              "w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm transition-all duration-200",
              "py-3 pr-4 outline-none placeholder-gray-400 dark:placeholder-gray-500",
              icon ? "pl-10" : "pl-4",
              isPassword ? "pr-11" : "",
              error
                ? "border-red-400 ring-1 ring-red-300 focus:border-red-500 focus:ring-red-300"
                : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {/* Password visibility toggle */}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-red-600 font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
export { FormInput };
export default FormInput;
