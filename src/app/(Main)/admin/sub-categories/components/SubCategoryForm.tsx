"use client";

// ============================================================
// src/app/(Main)/admin/sub-categories/components/SubCategoryForm.tsx
// React Hook Form + Zod — supports Create and Edit modes.
// Includes category dropdown populated from server.
// ============================================================

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag, FolderOpen } from "lucide-react";
import { subCategorySchema, type SubCategoryFormValues } from "@/lib/validations/subcategory";
import type { SubCategoryRow } from "../actions";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface SubCategoryFormProps {
  initialData?: SubCategoryRow;
  categories: CategoryOption[];
  onSubmit: (data: SubCategoryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function SubCategoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isSubmitting,
}: SubCategoryFormProps) {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
      categoryId: initialData?.categoryId ?? (0 as number),
      name: initialData?.name ?? "",
    },
  });

  useEffect(() => {
    reset({
      categoryId: initialData?.categoryId ?? (0 as number),
      name: initialData?.name ?? "",
    });
  }, [initialData, reset]);

  const inputBase =
    "w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white placeholder:text-gray-400 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed";
  const inputNormal = "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400";
  const inputError = "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Category dropdown */}
      <div>
        <label
          htmlFor="categoryId"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Category
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <FolderOpen
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <select
                id="categoryId"
                value={field.value === 0 ? "" : String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                disabled={isSubmitting}
                className={`${inputBase} pl-9 pr-4 appearance-none ${errors.categoryId ? inputError : inputNormal}`}
              >
                <option value="">Select a category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        {errors.categoryId && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Name field */}
      <div>
        <label
          htmlFor="sub-name"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Sub-Category Name
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <Tag
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="sub-name"
            type="text"
            {...register("name")}
            placeholder="e.g. CO2 Extinguishers"
            disabled={isSubmitting}
            className={`${inputBase} pl-9 pr-4 ${errors.name ? inputError : inputNormal}`}
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name.message}</p>
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
          {isEdit ? "Update Sub-Category" : "Create Sub-Category"}
        </button>
      </div>
    </form>
  );
}
