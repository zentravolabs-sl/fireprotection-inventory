"use client";

// ============================================================
// src/app/(Main)/tools/components/ToolForm.tsx
// React Hook Form + Zod for Tool management with Cloudinary image upload.
// ============================================================

import { useState, useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { toast } from "react-toastify";
import { Loader2, Wrench, Hash, Barcode, ShieldAlert, CheckCircle2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { toolSchema, type ToolFormValues } from "@/lib/validations/tool";
import { uploadImageToCloudinary } from "@/app/(Main)/inventory/upload-action";
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
  } = useForm({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      toolCode: initialData?.toolCode ?? "",
      name: initialData?.name ?? "",
      serialNo: initialData?.serialNo ?? "",
      condition: initialData?.condition ?? "Good",
      status: initialData?.status ?? "Available",
      imageUrl: initialData?.imageUrl ?? "",
    },
  });

  const imageUrlValue = useWatch({ control, name: "imageUrl" });

  useEffect(() => {
    reset({
      toolCode: initialData?.toolCode ?? "",
      name: initialData?.name ?? "",
      serialNo: initialData?.serialNo ?? "",
      condition: initialData?.condition ?? "Good",
      status: initialData?.status ?? "Available",
      imageUrl: initialData?.imageUrl ?? "",
    });
  }, [initialData, reset]);

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
        toast.success("Tool image uploaded to Cloudinary successfully!");
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
        <div>
          <label htmlFor="toolCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Tool Code / ID *
          </label>
          <div className="relative">
            <Barcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="toolCode"
              type="text"
              {...register("toolCode")}
              placeholder="e.g. TL-DRILL-001"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60 ${
                errors.toolCode ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          {errors.toolCode && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.toolCode.message}</p>}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Tool Name *
          </label>
          <div className="relative">
            <Wrench size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="e.g. Bosch Heavy Duty Cordless Drill"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60 ${
                errors.name ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name.message}</p>}
        </div>
      </div>

      {/* Serial Number */}
      <div>
        <label htmlFor="serialNo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Serial Number *
        </label>
        <div className="relative">
          <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="serialNo"
            type="text"
            {...register("serialNo")}
            placeholder="e.g. SN-89482910-B"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60 ${
              errors.serialNo ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
        </div>
        {errors.serialNo && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.serialNo.message}</p>}
      </div>

      {/* Condition & Status Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="condition" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Condition *
          </label>
          <Controller
            control={control}
            name="condition"
            render={({ field }) => {
              const opts = [
                { value: "New", label: "New" },
                { value: "Good", label: "Good" },
                { value: "Fair", label: "Fair" },
                { value: "Damaged", label: "Damaged" },
                { value: "UnderRepair", label: "Under Repair" },
              ];
              return (
                <Select
                  instanceId="tool-condition-select"
                  options={opts}
                  value={opts.find((o) => o.value === field.value) || null}
                  onChange={(val) => val && field.onChange(val.value)}
                  isDisabled={isSubmitting}
                  isSearchable={false}
                  menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                  styles={getCustomSelectStyles(!!errors.condition)}
                />
              );
            }}
          />
          {errors.condition && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.condition.message}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Status *
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => {
              const opts = [
                { value: "Available", label: "Available" },
                { value: "InUse", label: "In Use" },
                { value: "Maintenance", label: "Maintenance" },
                { value: "Lost", label: "Lost" },
                { value: "Retired", label: "Retired" },
              ];
              return (
                <Select
                  instanceId="tool-status-select"
                  options={opts}
                  value={opts.find((o) => o.value === field.value) || null}
                  onChange={(val) => val && field.onChange(val.value)}
                  isDisabled={isSubmitting}
                  isSearchable={false}
                  menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                  styles={getCustomSelectStyles(!!errors.status)}
                />
              );
            }}
          />
          {errors.status && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.status.message}</p>}
        </div>
      </div>

      {/* Image Upload - Single Row */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tool Image</label>
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

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting || isUploadingImage}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          Reset Form
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
            {isEdit ? "Update Tool" : "Create Tool"}
          </button>
        </div>
      </div>
    </form>
  );
}
