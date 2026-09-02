"use client";

// ============================================================
// src/app/(Main)/inventory/components/InventoryForm.tsx
// React Form for Inventory Master Item Creation and Editing.
// Matches the new clean 3NF ERP schema.
// ============================================================

import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { toast } from "react-toastify";
import { Loader2, Package, Barcode, MapPin, DollarSign, Layers, UploadCloud, Image as ImageIcon } from "lucide-react";
import { inventorySchema, type InventoryFormValues } from "@/lib/validations/inventory";
import { getSubCategoriesByCategoryId, type InventoryRow } from "../actions";
import { uploadImageToCloudinary } from "../upload-action";

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemCode: initialData?.itemCode ?? "",
      name: initialData?.name ?? "",
      categoryId: initialData?.categoryId ?? 0,
      subCategoryId: initialData?.subCategoryId ?? 0,
      brand: initialData?.brand ?? "",

      minStock: initialData?.minStock ?? 0,
      barcode: initialData?.barcode ?? "",
      rackLocation: initialData?.rackLocation ?? "",
      warehouse: initialData?.warehouse ?? "Main Warehouse",
      defaultSellPrice: initialData?.defaultSellPrice ?? 0,
      imageUrl: initialData?.imageUrl ?? "",
      expiryControlled: initialData?.expiryControlled ?? false,
    },
  });

  const selectedCategory = watch("categoryId");
  const imageUrlValue = useWatch({ control, name: "imageUrl" });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadImageToCloudinary(formData);
      if (result.success && result.url) {
        setValue("imageUrl", result.url, { shouldValidate: true });
        toast.success("Inventory item image uploaded to Cloudinary successfully!");
      } else {
        toast.error(result.message || "Failed to upload image to Cloudinary.");
      }
    } catch (err) {
      toast.error("An error occurred while uploading item image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

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
    `w-full px-4 py-3 text-sm border rounded-xl outline-none transition-all duration-200
    placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
    disabled:opacity-60 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
        : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Code & Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="itemCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Item Code *
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
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Item Name *
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
          <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Category *
          </label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                instanceId="inventory-category-select"
                options={categories.map((c) => ({ value: c.id, label: c.categoryName }))}
                value={
                  categories
                    .filter((c) => c.id === field.value)
                    .map((c) => ({ value: c.id, label: c.categoryName }))[0] || null
                }
                onChange={(val) => {
                  field.onChange(val ? val.value : 0);
                  setValue("subCategoryId", 0);
                }}
                placeholder="Select Category"
                isDisabled={isSubmitting}
                isSearchable
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                styles={getCustomSelectStyles(!!errors.categoryId)}
              />
            )}
          />
          {errors.categoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="subCategoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Sub-Category *
          </label>
          <Controller
            control={control}
            name="subCategoryId"
            render={({ field }) => (
              <Select
                instanceId="inventory-subcategory-select"
                options={subCategories.map((s) => ({ value: s.id, label: s.name }))}
                value={
                  subCategories
                    .filter((s) => s.id === field.value)
                    .map((s) => ({ value: s.id, label: s.name }))[0] || null
                }
                onChange={(val) => field.onChange(val ? val.value : 0)}
                placeholder="Select Sub-Category"
                isDisabled={isSubmitting || !selectedCategory}
                isSearchable
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                styles={getCustomSelectStyles(!!errors.subCategoryId)}
              />
            )}
          />
          {errors.subCategoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.subCategoryId.message}</p>}
        </div>
      </div>

      {/* Brand & Min Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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
          <label htmlFor="minStock" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
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

      {/* Barcode, Rack Location, Warehouse & Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="barcode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Barcode
          </label>
          <input
            id="barcode"
            type="text"
            {...register("barcode")}
            placeholder="e.g. 890123456789"
            disabled={isSubmitting || isUploadingImage}
            className={inputClass(!!errors.barcode)}
          />
          {errors.barcode && <p className="mt-1 text-xs text-red-600 font-medium">{errors.barcode.message}</p>}
        </div>

        <div>
          <label htmlFor="rackLocation" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Rack Location
          </label>
          <input
            id="rackLocation"
            type="text"
            {...register("rackLocation")}
            placeholder="e.g. Rack A-12"
            disabled={isSubmitting || isUploadingImage}
            className={inputClass(!!errors.rackLocation)}
          />
        </div>

        <div>
          <label htmlFor="warehouse" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Warehouse
          </label>
          <input
            id="warehouse"
            type="text"
            {...register("warehouse")}
            placeholder="e.g. Main Warehouse"
            disabled={isSubmitting || isUploadingImage}
            className={inputClass(!!errors.warehouse)}
          />
        </div>

        <div>
          <label htmlFor="defaultSellPrice" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Selling Price ($)
          </label>
          <input
            id="defaultSellPrice"
            type="number"
            step="any"
            {...register("defaultSellPrice")}
            placeholder="0.00"
            disabled={isSubmitting || isUploadingImage}
            className={inputClass(!!errors.defaultSellPrice)}
          />
          {errors.defaultSellPrice && (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.defaultSellPrice.message}</p>
          )}
        </div>
      </div>

      {/* Item Image Upload - Single Row */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item Image</label>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-900 overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-700 flex-shrink-0">
              {imageUrlValue ? (
                <img
                  src={imageUrlValue}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={18} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                {imageUrlValue ? "Uploaded Image Preview" : "No image selected"}
              </p>
              {imageUrlValue ? (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-sm" title={imageUrlValue}>
                  {imageUrlValue}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">Upload WebP, JPG, or PNG image (max 3MB limit)</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <label
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border rounded-xl cursor-pointer transition-all ${
                isUploadingImage
                  ? "bg-red-50 border-red-300 text-red-600 opacity-70 pointer-events-none"
                  : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-red-400"
              }`}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 size={14} className="animate-spin text-red-600" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} className="text-red-600" />
                  <span>{imageUrlValue ? "Change Image" : "Choose Image"}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isSubmitting || isUploadingImage}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {imageUrlValue && (
              <button
                type="button"
                onClick={() => setValue("imageUrl", "", { shouldValidate: true })}
                disabled={isSubmitting || isUploadingImage}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expiry Controlled Settings */}
      <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl flex items-start gap-3">
        <input
          id="expiryControlled"
          type="checkbox"
          {...register("expiryControlled")}
          disabled={isSubmitting}
          className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
        />
        <div>
          <label htmlFor="expiryControlled" className="text-xs font-bold text-gray-900 dark:text-gray-100 cursor-pointer block">
            Expiry Controlled Item
          </label>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
            Enable batch-level expiry date tracking & FEFO (First Expiry, First Out) issuing rule (e.g. Sealant, Battery, Chemical Extinguisher).
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting || isUploadingImage}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          Reset
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingImage}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="w-40 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update Item" : "Save Item"}
          </button>
        </div>
      </div>
    </form>
  );
}
