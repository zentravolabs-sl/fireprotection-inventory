"use client";

// ============================================================
// src/app/(Main)/inventory/components/DependentCategorySelect.tsx
// Dependent Category and SubCategory dropdown pair.
// ============================================================

import { useState, useEffect } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Loader2 } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Category Dropdown */}
      <div>
        <label htmlFor="CategoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Category *
        </label>
        <Select
          instanceId="category-select"
          options={categories.map((cat) => ({ value: cat.id, label: cat.categoryName }))}
          value={categories.filter((cat) => cat.id === selectedCategoryId).map((cat) => ({ value: cat.id, label: cat.categoryName }))[0] || null}
          onChange={(val) => {
            onCategoryChange(val ? val.value : null);
            onSubCategoryChange(null);
          }}
          placeholder="Select Category"
          isDisabled={disabled}
          isSearchable
          isClearable
          menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
          styles={getCustomSelectStyles(!!categoryError)}
        />
        {categoryError && <p className="mt-1.5 text-xs text-red-600 font-medium">{categoryError}</p>}
      </div>

      {/* SubCategory Dropdown (Dependent) */}
      <div>
        <label htmlFor="SubCategoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Sub-Category *
        </label>
        <Select
          instanceId="subcategory-select"
          options={subCategories.map((sub) => ({ value: sub.id, label: sub.name }))}
          value={subCategories.filter((sub) => sub.id === selectedSubCategoryId).map((sub) => ({ value: sub.id, label: sub.name }))[0] || null}
          onChange={(val) => onSubCategoryChange(val ? val.value : null)}
          placeholder={
            !selectedCategoryId
              ? "Select Category First"
              : loadingSubCategories
              ? "Loading Sub-Categories..."
              : subCategories.length === 0
              ? "No Sub-Categories Found"
              : "Select Sub-Category"
          }
          isDisabled={disabled || !selectedCategoryId || loadingSubCategories}
          isLoading={loadingSubCategories}
          isSearchable
          isClearable
          menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
          styles={getCustomSelectStyles(!!subCategoryError)}
        />
        {subCategoryError && <p className="mt-1.5 text-xs text-red-600 font-medium">{subCategoryError}</p>}
      </div>
    </div>
  );
}
