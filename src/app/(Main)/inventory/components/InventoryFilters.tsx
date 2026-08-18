"use client";

// ============================================================
// src/app/(Main)/inventory/components/InventoryFilters.tsx
// Filter controls for Category, SubCategory, Warehouse, and Stock Status.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { getSubCategoriesByCategoryId } from "../actions";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface InventoryFiltersProps {
  categories: CategoryOption[];
}

const STOCK_STATUS_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out Of Stock" },
];

export default function InventoryFilters({ categories }: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("categoryId") || "";
  const currentSubCategory = searchParams.get("subCategoryId") || "";
  const currentWarehouse = searchParams.get("warehouse") || "";
  const currentStockStatus = searchParams.get("stockStatus") || "all";

  const [subCategories, setSubCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!currentCategory) {
      setSubCategories([]);
      return;
    }

    let isMounted = true;
    getSubCategoriesByCategoryId(Number(currentCategory)).then((res) => {
      if (isMounted) setSubCategories(res);
    });

    return () => {
      isMounted = false;
    };
  }, [currentCategory]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "categoryId") {
      params.delete("subCategoryId");
    }

    router.push(`/inventory?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryId");
    params.delete("subCategoryId");
    params.delete("warehouse");
    params.delete("stockStatus");
    router.push(`/inventory?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
      currentSubCategory ||
      currentWarehouse ||
      (currentStockStatus && currentStockStatus !== "all")
  );

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: String(c.id), label: c.categoryName })),
  ];
  const selectedCategoryOption =
    categoryOptions.find((opt) => opt.value === currentCategory) || categoryOptions[0];

  const subCategoryOptions = [
    { value: "", label: "All Sub-Categories" },
    ...subCategories.map((s) => ({ value: String(s.id), label: s.name })),
  ];
  const selectedSubCategoryOption =
    subCategoryOptions.find((opt) => opt.value === currentSubCategory) || subCategoryOptions[0];

  const selectedStockStatusOption =
    STOCK_STATUS_OPTIONS.find((opt) => opt.value === currentStockStatus) || STOCK_STATUS_OPTIONS[0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold text-sm">
          <Filter size={15} className="text-red-600 dark:text-red-400" />
          <span>Filters</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <Select
            instanceId="inventory-category-filter"
            classNamePrefix="react-select"
            options={categoryOptions}
            value={selectedCategoryOption}
            onChange={(val) => updateParam("categoryId", val ? val.value : "")}
            isSearchable
            styles={getCustomSelectStyles(false, "38px")}
          />
        </div>

        {/* SubCategory Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
          <Select
            instanceId="inventory-subcategory-filter"
            classNamePrefix="react-select"
            options={subCategoryOptions}
            value={selectedSubCategoryOption}
            onChange={(val) => updateParam("subCategoryId", val ? val.value : "")}
            isDisabled={!currentCategory}
            isSearchable
            styles={getCustomSelectStyles(false, "38px")}
          />
        </div>

        {/* Warehouse Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse</label>
          <input
            type="text"
            placeholder="Filter by warehouse..."
            value={currentWarehouse}
            onChange={(e) => updateParam("warehouse", e.target.value)}
            className="w-full px-3 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500 h-[38px]"
          />
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Status</label>
          <Select
            instanceId="inventory-stock-status-filter"
            classNamePrefix="react-select"
            options={STOCK_STATUS_OPTIONS}
            value={selectedStockStatusOption}
            onChange={(val) => updateParam("stockStatus", val ? val.value : "all")}
            isSearchable={false}
            styles={getCustomSelectStyles(false, "38px")}
          />
        </div>
      </div>
    </div>
  );
}
