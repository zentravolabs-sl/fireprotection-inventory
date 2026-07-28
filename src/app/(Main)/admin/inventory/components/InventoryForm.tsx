"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/InventoryForm.tsx
// React Hook Form + Zod with Cloudinary image upload to folder Cdnfire.
// ============================================================

import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Loader2, Package, Barcode, Hash, DollarSign, Image as ImageIcon, MapPin, Building, Calendar, UploadCloud } from "lucide-react";
import { inventorySchema, type InventoryFormValues } from "@/lib/validations/inventory";
import DependentCategorySelect from "./DependentCategorySelect";
import SearchableSupplierSelect from "./SearchableSupplierSelect";
import { uploadImageToCloudinary } from "../upload-action";
import type { InventoryRow } from "../actions";
import type { z } from "zod";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface InventoryFormProps {
  categories: CategoryOption[];
  initialData?: InventoryRow;
  onSubmit: (data: InventoryFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function InventoryForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: InventoryFormProps) {
  const isEdit = Boolean(initialData);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof inventorySchema>, any, InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      ItemCode: initialData?.ItemCode ?? "",
      Name: initialData?.Name ?? "",
      CategoryId: initialData?.CategoryId ?? "",
      SubCategoryId: initialData?.SubCategoryId ?? "",
      Brand: initialData?.Brand ?? "",
      Unit: initialData?.Unit ?? "Pcs",
      Qty: initialData?.Qty ?? 0,
      MinStock: initialData?.MinStock ?? 0,
      RackLocation: initialData?.RackLocation ?? "",
      Warehouse: initialData?.Warehouse ?? "",
      BuyPrice: initialData?.BuyPrice ?? 0,
      SellPrice: initialData?.SellPrice ?? 0,
      SupplierId: initialData?.SupplierId ?? null,
      Barcode: initialData?.Barcode ?? "",
      ExpiryDate: initialData?.ExpiryDate ? new Date(initialData.ExpiryDate).toISOString().split("T")[0] : "",
      image_url: initialData?.image_url ?? "",
      issueLocation: initialData?.issueLocation ?? "Warehouse",
    },
  });

  const categoryIdValue = useWatch({ control, name: "CategoryId" });
  const subCategoryIdValue = useWatch({ control, name: "SubCategoryId" });
  const imageUrlValue = useWatch({ control, name: "image_url" });

  useEffect(() => {
    reset({
      ItemCode: initialData?.ItemCode ?? "",
      Name: initialData?.Name ?? "",
      CategoryId: initialData?.CategoryId ?? "",
      SubCategoryId: initialData?.SubCategoryId ?? "",
      Brand: initialData?.Brand ?? "",
      Unit: initialData?.Unit ?? "Pcs",
      Qty: initialData?.Qty ?? 0,
      MinStock: initialData?.MinStock ?? 0,
      RackLocation: initialData?.RackLocation ?? "",
      Warehouse: initialData?.Warehouse ?? "",
      BuyPrice: initialData?.BuyPrice ?? 0,
      SellPrice: initialData?.SellPrice ?? 0,
      SupplierId: initialData?.SupplierId ?? null,
      Barcode: initialData?.Barcode ?? "",
      ExpiryDate: initialData?.ExpiryDate ? new Date(initialData.ExpiryDate).toISOString().split("T")[0] : "",
      image_url: initialData?.image_url ?? "",
      issueLocation: initialData?.issueLocation ?? "Warehouse",
    });
  }, [initialData, reset]);

  // Handler for Cloudinary file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadImageToCloudinary(formData);
      if (result.success && result.url) {
        setValue("image_url", result.url, { shouldValidate: true });
        toast.success("Image uploaded to Cloudinary (Cdnfire) successfully!");
      } else {
        toast.error(result.message || "Failed to upload image to Cloudinary.");
      }
    } catch (err) {
      toast.error("An error occurred while uploading image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* ── Basic Product Info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Item Code (Required) */}
        <div>
          <label htmlFor="ItemCode" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Item Code / SKU <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Barcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="ItemCode"
              type="text"
              {...register("ItemCode")}
              placeholder="e.g. EXT-ABC-6KG"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
                errors.ItemCode ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.ItemCode && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.ItemCode.message}</p>}
        </div>

        {/* Item Name (Required) */}
        <div>
          <label htmlFor="Name" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="Name"
              type="text"
              {...register("Name")}
              placeholder="e.g. 6kg ABC Dry Powder Fire Extinguisher"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
                errors.Name ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.Name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Name.message}</p>}
        </div>
      </div>

      {/* ── Dependent Category & SubCategory ── */}
      <DependentCategorySelect
        categories={categories}
        selectedCategoryId={categoryIdValue ? Number(categoryIdValue) : null}
        selectedSubCategoryId={subCategoryIdValue ? Number(subCategoryIdValue) : null}
        onCategoryChange={(val) => setValue("CategoryId", val as any, { shouldValidate: true })}
        onSubCategoryChange={(val) => setValue("SubCategoryId", val as any, { shouldValidate: true })}
        disabled={isSubmitting}
        categoryError={errors.CategoryId?.message}
        subCategoryError={errors.SubCategoryId?.message}
      />

      {/* ── Brand, Unit, Barcode ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Brand */}
        <div>
          <label htmlFor="Brand" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Brand (Optional)
          </label>
          <input
            id="Brand"
            type="text"
            {...register("Brand")}
            placeholder="e.g. FireShield"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"
          />
        </div>

        {/* Unit (Required) */}
        <div>
          <label htmlFor="Unit" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Unit <span className="text-red-500">*</span>
          </label>
          <input
            id="Unit"
            type="text"
            {...register("Unit")}
            placeholder="e.g. Pcs, Box, Meter"
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
              errors.Unit ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            }`}
          />
          {errors.Unit && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Unit.message}</p>}
        </div>

        {/* Barcode (Optional) */}
        <div>
          <label htmlFor="Barcode" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Barcode (Optional)
          </label>
          <input
            id="Barcode"
            type="text"
            {...register("Barcode")}
            placeholder="e.g. 8901234567890"
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
              errors.Barcode ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            }`}
          />
          {errors.Barcode && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Barcode.message}</p>}
        </div>
      </div>

      {/* ── Quantities & Stock ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current Qty */}
        <div>
          <label htmlFor="Qty" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Current Stock (Qty) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="Qty"
              type="number"
              step="any"
              min={0}
              {...register("Qty")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
                errors.Qty ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.Qty && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Qty.message}</p>}
        </div>

        {/* Min Stock */}
        <div>
          <label htmlFor="MinStock" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Minimum Stock Threshold <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="MinStock"
              type="number"
              step="any"
              min={0}
              {...register("MinStock")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
                errors.MinStock ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.MinStock && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.MinStock.message}</p>}
        </div>
      </div>

      {/* ── Pricing (BuyPrice vs SellPrice) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Buy Price */}
        <div>
          <label htmlFor="BuyPrice" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Buy Price ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="BuyPrice"
              type="number"
              step="0.01"
              min={0}
              {...register("BuyPrice")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
                errors.BuyPrice ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.BuyPrice && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.BuyPrice.message}</p>}
        </div>

        {/* Sell Price */}
        <div>
          <label htmlFor="SellPrice" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Sell Price ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="SellPrice"
              type="number"
              step="0.01"
              min={0}
              {...register("SellPrice")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white ${
                errors.SellPrice ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.SellPrice && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.SellPrice.message}</p>}
        </div>
      </div>

      {/* ── Supplier & Issue Location ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Supplier */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Supplier (Optional)
          </label>
          <Controller
            name="SupplierId"
            control={control}
            render={({ field }) => (
              <SearchableSupplierSelect
                value={field.value ? Number(field.value) : null}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={errors.SupplierId?.message}
              />
            )}
          />
        </div>

        {/* Issue Location (Enum: Warehouse | Shop) */}
        <div>
          <label htmlFor="issueLocation" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Issue Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              id="issueLocation"
              {...register("issueLocation")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white text-gray-900 ${
                errors.issueLocation ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            >
              <option value="Warehouse">Warehouse</option>
              <option value="Shop">Shop</option>
            </select>
          </div>
          {errors.issueLocation && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.issueLocation.message}</p>}
        </div>
      </div>

      {/* ── Location & Dates ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Warehouse */}
        <div>
          <label htmlFor="Warehouse" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Warehouse Name
          </label>
          <input
            id="Warehouse"
            type="text"
            {...register("Warehouse")}
            placeholder="e.g. Main Warehouse A"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"
          />
        </div>

        {/* Rack Location */}
        <div>
          <label htmlFor="RackLocation" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Rack Location
          </label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="RackLocation"
              type="text"
              {...register("RackLocation")}
              placeholder="e.g. Rack B-12"
              disabled={isSubmitting}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="ExpiryDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Expiry Date (Optional)
          </label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="ExpiryDate"
              type="date"
              {...register("ExpiryDate")}
              disabled={isSubmitting}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── Hidden Image URL Field ── */}
      <input type="hidden" {...register("image_url")} />

      {/* ── Image Upload (Cloudinary: Cdnfire) ── */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Product Image
        </label>

        {/* Upload File Input Button */}
        <div className="flex items-center gap-3">
          <label
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isUploadingImage
                ? "bg-red-50 border-red-300 text-red-600 opacity-70 pointer-events-none"
                : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-red-400"
            }`}
          >
            {isUploadingImage ? (
              <>
                <Loader2 size={16} className="animate-spin text-red-600" />
                <span>Uploading Image to Cloudinary (Cdnfire)...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} className="text-red-600" />
                <span>{imageUrlValue ? "Change Image (Upload to Cdnfire)" : "Choose Image to Upload"}</span>
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
        </div>

        {/* Live Image Preview Container */}
        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-300 flex-shrink-0">
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
                  <ImageIcon size={20} />
                  <span className="text-[9px] uppercase font-bold mt-0.5">No Image</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                {imageUrlValue ? "Uploaded Image Preview" : "No Image Uploaded"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {imageUrlValue ? "Saved in Cloudinary (Cdnfire)" : "Click 'Choose Image' above to select and upload an image."}
              </p>
            </div>
          </div>

          {imageUrlValue && (
            <button
              type="button"
              onClick={() => setValue("image_url", "", { shouldValidate: true })}
              disabled={isSubmitting || isUploadingImage}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* ── Form Actions ── */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting || isUploadingImage}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Reset Form
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingImage}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update Inventory Item" : "Create Inventory Item"}
          </button>
        </div>
      </div>
    </form>
  );
}
