"use client";

// ============================================================
// src/app/(Main)/admin/categories/components/CategoryForm.tsx
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
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Category Name
          <span className="text-red-500 ml-0.5">*</span>
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
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-400 text-gray-900 bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.categoryName
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
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
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200
            rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
            bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
