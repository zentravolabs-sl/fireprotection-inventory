"use client";

// ============================================================
// src/app/(Main)/categories/components/CategoryForm.tsx
// React Hook Form + Zod — supports Create and Edit modes.
// ============================================================

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag } from "lucide-react";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/category";
import type { CategoryRow } from "../actions";

interface CategoryFormProps {
  /** Populated when editing an existing category */
  initialData?: CategoryRow;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CategoryFormProps) {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: initialData?.categoryName ?? "",
    },
  });

  // Sync form when editing a different row
  useEffect(() => {
    reset({ categoryName: initialData?.categoryName ?? "" });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Category Name field */}
      <div>
        <label
          htmlFor="categoryName"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Category Name *
        </label>
        <div className="relative">
          <Tag
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="categoryName"
            type="text"
            {...register("categoryName")}
            placeholder="e.g. Fire Extinguishers"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60 ${
              errors.categoryName ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
        </div>
        {errors.categoryName && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.categoryName.message}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-40 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
