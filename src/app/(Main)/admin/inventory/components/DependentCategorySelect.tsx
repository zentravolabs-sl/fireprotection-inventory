"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/DependentCategorySelect.tsx
// Dependent Category and SubCategory dropdown pair.
// ============================================================

import { useState, useEffect } from "react";
import { Tag, Layers, Loader2 } from "lucide-react";
import { getSubCategoriesByCategoryId } from "../actions";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface SubCategoryOption {
  id: number;
  name: string;
}

interface DependentCategorySelectProps {
  categories: CategoryOption[];
  selectedCategoryId?: number | null;
  selectedSubCategoryId?: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onSubCategoryChange: (subCategoryId: number | null) => void;
  disabled?: boolean;
  categoryError?: string;
  subCategoryError?: string;
}

export default function DependentCategorySelect({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onCategoryChange,
  onSubCategoryChange,
  disabled = false,
  categoryError,
  subCategoryError,
}: DependentCategorySelectProps) {
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  // Fetch subcategories whenever selectedCategoryId changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubCategories([]);
      return;
    }

    let isMounted = true;
    setLoadingSubCategories(true);

    getSubCategoriesByCategoryId(selectedCategoryId)
      .then((res) => {
        if (isMounted) setSubCategories(res);
      })
      .finally(() => {
        if (isMounted) setLoadingSubCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId]);

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    onCategoryChange(val);
    onSubCategoryChange(null); // Reset subcategory when category changes
  };

  const handleSubCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    onSubCategoryChange(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Category Dropdown */}
      <div>
        <label htmlFor="CategoryId" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            id="CategoryId"
            value={selectedCategoryId ?? ""}
            onChange={handleCategorySelect}
            disabled={disabled}
            className={`w-full pl-9 pr-8 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white appearance-none text-gray-900
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                categoryError
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
        {categoryError && <p className="mt-1.5 text-xs text-red-600 font-medium">{categoryError}</p>}
      </div>

      {/* SubCategory Dropdown (Dependent) */}
      <div>
        <label htmlFor="SubCategoryId" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Sub-Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Layers size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {loadingSubCategories && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
          <select
            id="SubCategoryId"
            value={selectedSubCategoryId ?? ""}
            onChange={handleSubCategorySelect}
            disabled={disabled || !selectedCategoryId || loadingSubCategories}
            className={`w-full pl-9 pr-8 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white appearance-none text-gray-900
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                subCategoryError
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          >
            <option value="">
              {!selectedCategoryId
                ? "Select Category First"
                : loadingSubCategories
                ? "Loading Sub-Categories..."
                : subCategories.length === 0
                ? "No Sub-Categories Found"
                : "Select Sub-Category"}
            </option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
        {subCategoryError && <p className="mt-1.5 text-xs text-red-600 font-medium">{subCategoryError}</p>}
      </div>
    </div>
  );
}
