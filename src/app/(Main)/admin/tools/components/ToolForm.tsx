"use client";

// ============================================================
// src/app/(Main)/admin/tools/components/ToolForm.tsx
// React Hook Form + Zod for Tool management with Cloudinary image upload.
// ============================================================

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Loader2, Wrench, Hash, Barcode, ShieldAlert, CheckCircle2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { toolSchema, type ToolFormValues } from "@/lib/validations/tool";
import { uploadImageToCloudinary } from "@/app/(Main)/admin/inventory/upload-action";
import type { ToolRow } from "../actions";

interface ToolFormProps {
  initialData?: ToolRow;
  onSubmit: (data: ToolFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ToolForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ToolFormProps) {
  const isEdit = Boolean(initialData);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof toolSchema>, any, ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      ToolCode: initialData?.ToolCode ?? "",
      Name: initialData?.Name ?? "",
      SerialNo: initialData?.SerialNo ?? "",
      Condition: initialData?.Condition ?? "Good",
      Status: initialData?.Status ?? "Available",
      image_url: initialData?.image_url ?? "",
    },
  });

  const imageUrlValue = useWatch({ control, name: "image_url" });

  useEffect(() => {
    reset({
      ToolCode: initialData?.ToolCode ?? "",
      Name: initialData?.Name ?? "",
      SerialNo: initialData?.SerialNo ?? "",
      Condition: initialData?.Condition ?? "Good",
      Status: initialData?.Status ?? "Available",
      image_url: initialData?.image_url ?? "",
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
        toast.success("Tool image uploaded to Cloudinary (Cdnfire) successfully!");
      } else {
        toast.error(result.message || "Failed to upload image to Cloudinary.");
      }
    } catch (err) {
      toast.error("An error occurred while uploading tool image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Tool Code & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tool Code */}
        <div>
          <label htmlFor="ToolCode" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tool Code / ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Barcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="ToolCode"
              type="text"
              {...register("ToolCode")}
              placeholder="e.g. TL-DRILL-001"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
                errors.ToolCode
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.ToolCode && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.ToolCode.message}</p>}
        </div>

        {/* Tool Name */}
        <div>
          <label htmlFor="Name" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tool Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Wrench size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="Name"
              type="text"
              {...register("Name")}
              placeholder="e.g. Bosch Heavy Duty Cordless Drill"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
                errors.Name
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            />
          </div>
          {errors.Name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Name.message}</p>}
        </div>
      </div>

      {/* Serial Number */}
      <div>
        <label htmlFor="SerialNo" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Serial Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="SerialNo"
            type="text"
            {...register("SerialNo")}
            placeholder="e.g. SN-89482910-B"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
              errors.SerialNo
                ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            }`}
          />
        </div>
        {errors.SerialNo && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.SerialNo.message}</p>}
      </div>

      {/* Condition & Status Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Condition Dropdown */}
        <div>
          <label htmlFor="Condition" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Condition <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <ShieldAlert size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              id="Condition"
              {...register("Condition")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white text-gray-900 ${
                errors.Condition
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Damaged">Damaged</option>
              <option value="UnderRepair">Under Repair</option>
            </select>
          </div>
          {errors.Condition && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Condition.message}</p>}
        </div>

        {/* Status Dropdown */}
        <div>
          <label htmlFor="Status" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <CheckCircle2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              id="Status"
              {...register("Status")}
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-white text-gray-900 ${
                errors.Status
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
            >
              <option value="Available">Available</option>
              <option value="InUse">In Use</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
          {errors.Status && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Status.message}</p>}
        </div>
      </div>

      {/* ── Hidden Image URL Field ── */}
      <input type="hidden" {...register("image_url")} />

      {/* ── Image Upload (Cloudinary: Cdnfire) ── */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Tool Image
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
                <span>{imageUrlValue ? "Change Tool Image (Upload to Cdnfire)" : "Choose Tool Image to Upload"}</span>
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
                {imageUrlValue ? "Saved in Cloudinary (Cdnfire)" : "Click 'Choose Tool Image' above to upload."}
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

      {/* Form Actions */}
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
            {isEdit ? "Update Tool" : "Create Tool"}
          </button>
        </div>
      </div>
    </form>
  );
}
