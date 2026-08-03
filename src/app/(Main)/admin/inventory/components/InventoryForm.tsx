"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/InventoryForm.tsx
// React Form for Inventory Master Item Creation and Editing.
// Matches the new clean 3NF ERP schema.
// ============================================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Package, Barcode, MapPin, DollarSign, Layers } from "lucide-react";
import { inventorySchema, type InventoryFormValues } from "@/lib/validations/inventory";
import { getSubCategoriesByCategoryId, type InventoryRow } from "../actions";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface InventoryFormProps {
  initialData?: InventoryRow;
  categories: CategoryOption[];
  onSubmit: (data: InventoryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function InventoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isSubmitting,
}: InventoryFormProps) {
  const isEdit = Boolean(initialData);
  const [subCategories, setSubCategories] = useState<{ id: number; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemCode: initialData?.itemCode ?? "",
      name: initialData?.name ?? "",
      categoryId: initialData?.categoryId ?? 0,
      subCategoryId: initialData?.subCategoryId ?? 0,
      brand: initialData?.brand ?? "",
      unit: initialData?.unit ?? "Pcs",
      minStock: initialData?.minStock ?? 0,
      barcode: initialData?.barcode ?? "",
      rackLocation: initialData?.rackLocation ?? "",
      warehouse: initialData?.warehouse ?? "Main Warehouse",
      defaultSellPrice: initialData?.defaultSellPrice ?? 0,
      imageUrl: initialData?.imageUrl ?? "",
    },
  });

  const selectedCategory = watch("categoryId");

  // Load sub-categories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([]);
      return;
    }
    let isMounted = true;
    getSubCategoriesByCategoryId(Number(selectedCategory)).then((res) => {
      if (isMounted) setSubCategories(res);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  useEffect(() => {
    if (initialData) {
      reset({
        itemCode: initialData.itemCode,
        name: initialData.name,
        categoryId: initialData.categoryId,
        subCategoryId: initialData.subCategoryId,
        brand: initialData.brand ?? "",
        unit: initialData.unit,
        minStock: initialData.minStock,
        barcode: initialData.barcode ?? "",
        rackLocation: initialData.rackLocation ?? "",
        warehouse: initialData.warehouse ?? "Main Warehouse",
        defaultSellPrice: initialData.defaultSellPrice,
        imageUrl: initialData.imageUrl ?? "",
      });
    }
  }, [initialData, reset]);

  const inputClass = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-400 text-gray-900 bg-white
    disabled:opacity-60 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Code & Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="itemCode" className="block text-xs font-semibold text-gray-700 mb-1">
            Item Code <span className="text-red-500">*</span>
          </label>
          <input
            id="itemCode"
            type="text"
            {...register("itemCode")}
            placeholder="e.g. PIPE-GALV-001"
            disabled={isSubmitting}
            className={inputClass(!!errors.itemCode)}
          />
          {errors.itemCode && <p className="mt-1 text-xs text-red-600 font-medium">{errors.itemCode.message}</p>}
        </div>

        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            placeholder="e.g. 2 inch Galvanized Steel Pipe"
            disabled={isSubmitting}
            className={inputClass(!!errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
        </div>
      </div>

      {/* Category & SubCategory Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-xs font-semibold text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            {...register("categoryId")}
            onChange={(e) => {
              setValue("categoryId", Number(e.target.value));
              setValue("subCategoryId", 0);
            }}
            disabled={isSubmitting}
            className={inputClass(!!errors.categoryId)}
          >
            <option value="0">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="subCategoryId" className="block text-xs font-semibold text-gray-700 mb-1">
            Sub-Category <span className="text-red-500">*</span>
          </label>
          <select
            id="subCategoryId"
            {...register("subCategoryId")}
            disabled={isSubmitting || !selectedCategory}
            className={inputClass(!!errors.subCategoryId)}
          >
            <option value="0">Select Sub-Category</option>
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.subCategoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.subCategoryId.message}</p>}
        </div>
      </div>

      {/* Brand, Unit & Min Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="brand" className="block text-xs font-semibold text-gray-700 mb-1">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            {...register("brand")}
            placeholder="e.g. Victaulic / Tyco"
            disabled={isSubmitting}
            className={inputClass(!!errors.brand)}
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-xs font-semibold text-gray-700 mb-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <input
            id="unit"
            type="text"
            {...register("unit")}
            placeholder="e.g. Pcs / Mtr / Box"
            disabled={isSubmitting}
            className={inputClass(!!errors.unit)}
          />
          {errors.unit && <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit.message}</p>}
        </div>

        <div>
          <label htmlFor="minStock" className="block text-xs font-semibold text-gray-700 mb-1">
            Minimum Stock
          </label>
          <input
            id="minStock"
            type="number"
            step="any"
            {...register("minStock")}
            placeholder="e.g. 10"
            disabled={isSubmitting}
            className={inputClass(!!errors.minStock)}
          />
          {errors.minStock && <p className="mt-1 text-xs text-red-600 font-medium">{errors.minStock.message}</p>}
        </div>
      </div>

      {/* Barcode, Rack Location, Warehouse */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="barcode" className="block text-xs font-semibold text-gray-700 mb-1">
            Barcode
          </label>
          <input
            id="barcode"
            type="text"
            {...register("barcode")}
            placeholder="e.g. 890123456789"
            disabled={isSubmitting}
            className={inputClass(!!errors.barcode)}
          />
          {errors.barcode && <p className="mt-1 text-xs text-red-600 font-medium">{errors.barcode.message}</p>}
        </div>

        <div>
          <label htmlFor="rackLocation" className="block text-xs font-semibold text-gray-700 mb-1">
            Rack Location
          </label>
          <input
            id="rackLocation"
            type="text"
            {...register("rackLocation")}
            placeholder="e.g. Rack A-12"
            disabled={isSubmitting}
            className={inputClass(!!errors.rackLocation)}
          />
        </div>

        <div>
          <label htmlFor="warehouse" className="block text-xs font-semibold text-gray-700 mb-1">
            Warehouse
          </label>
          <input
            id="warehouse"
            type="text"
            {...register("warehouse")}
            placeholder="e.g. Main Warehouse"
            disabled={isSubmitting}
            className={inputClass(!!errors.warehouse)}
          />
        </div>
      </div>

      {/* Pricing & Image URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="defaultSellPrice" className="block text-xs font-semibold text-gray-700 mb-1">
            Default Selling Price ($)
          </label>
          <input
            id="defaultSellPrice"
            type="number"
            step="any"
            {...register("defaultSellPrice")}
            placeholder="0.00"
            disabled={isSubmitting}
            className={inputClass(!!errors.defaultSellPrice)}
          />
          {errors.defaultSellPrice && (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.defaultSellPrice.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-xs font-semibold text-gray-700 mb-1">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="text"
            {...register("imageUrl")}
            placeholder="https://example.com/image.png"
            disabled={isSubmitting}
            className={inputClass(!!errors.imageUrl)}
          />
          {errors.imageUrl && <p className="mt-1 text-xs text-red-600 font-medium">{errors.imageUrl.message}</p>}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Reset
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update Item" : "Save Item"}
          </button>
        </div>
      </div>
    </form>
  );
}
