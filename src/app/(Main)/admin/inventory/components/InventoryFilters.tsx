"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/InventoryFilters.tsx
// Filter controls for Category, SubCategory, Supplier, Issue Location, Stock Status, and Expiry Status.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, RefreshCw } from "lucide-react";
import { getSubCategoriesByCategoryId } from "../actions";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface SupplierOption {
  Id: number;
  Company: string;
}

interface InventoryFiltersProps {
  categories: CategoryOption[];
  suppliers: SupplierOption[];
}

export default function InventoryFilters({ categories, suppliers }: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("categoryId") || "";
  const currentSubCategory = searchParams.get("subCategoryId") || "";
  const currentSupplier = searchParams.get("supplierId") || "";
  const currentIssueLocation = searchParams.get("issueLocation") || "";
  const currentStockStatus = searchParams.get("stockStatus") || "All";
  const currentExpiryStatus = searchParams.get("expiryStatus") || "All";

  const [subCategories, setSubCategories] = useState<{ id: number; name: string }[]>([]);

  // Load subcategories when selected category changes
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
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset subCategory if Category changes
    if (key === "categoryId") {
      params.delete("subCategoryId");
    }

    router.push(`/admin/inventory?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryId");
    params.delete("subCategoryId");
    params.delete("supplierId");
    params.delete("issueLocation");
    params.delete("stockStatus");
    params.delete("expiryStatus");
    router.push(`/admin/inventory?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
      currentSubCategory ||
      currentSupplier ||
      currentIssueLocation ||
      (currentStockStatus && currentStockStatus !== "All") ||
      (currentExpiryStatus && currentExpiryStatus !== "All")
  );

  return (
    <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] p-4 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#dce3ef] font-semibold text-sm">
          <Filter size={15} className="text-[#e02424]" />
          <span>Filters</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e02424] hover:underline"
          >
            <X size={13} />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Category</label>
          <select
            value={currentCategory}
            onChange={(e) => updateParam("categoryId", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* SubCategory Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Sub-Category</label>
          <select
            value={currentSubCategory}
            onChange={(e) => updateParam("subCategoryId", e.target.value)}
            disabled={!currentCategory}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424] disabled:opacity-50"
          >
            <option value="">All Sub-Categories</option>
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Supplier</label>
          <select
            value={currentSupplier}
            onChange={(e) => updateParam("supplierId", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.Id} value={s.Id}>
                {s.Company}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Location Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Issue Location</label>
          <select
            value={currentIssueLocation}
            onChange={(e) => updateParam("issueLocation", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          >
            <option value="">All Locations</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Shop">Shop</option>
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Stock Status</label>
          <select
            value={currentStockStatus}
            onChange={(e) => updateParam("stockStatus", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          >
            <option value="All">All Stock</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out Of Stock">Out Of Stock</option>
          </select>
        </div>

        {/* Expiry Status Filter */}
        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Expiry Status</label>
          <select
            value={currentExpiryStatus}
            onChange={(e) => updateParam("expiryStatus", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          >
            <option value="All">All Items</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon (30 Days)</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>
    </div>
  );
}
