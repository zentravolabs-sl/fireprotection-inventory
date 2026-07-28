"use client";

// ============================================================
// src/app/(Main)/admin/suppliers/components/SupplierForm.tsx
// React Hook Form + Zod — supports Create, Edit, and Reset modes.
// ============================================================

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, User, Phone as PhoneIcon, Mail, MapPin } from "lucide-react";
import { supplierSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import type { SupplierRow } from "../actions";

interface SupplierFormProps {
  /** Populated when editing an existing supplier */
  initialData?: SupplierRow;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function SupplierForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: SupplierFormProps) {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      Company: initialData?.Company ?? "",
      ContactPerson: initialData?.ContactPerson ?? "",
      Phone: initialData?.Phone ?? "",
      Email: initialData?.Email ?? "",
      Address: initialData?.Address ?? "",
    },
  });

  // Sync form state when editing target changes
  useEffect(() => {
    reset({
      Company: initialData?.Company ?? "",
      ContactPerson: initialData?.ContactPerson ?? "",
      Phone: initialData?.Phone ?? "",
      Email: initialData?.Email ?? "",
      Address: initialData?.Address ?? "",
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Company Name (Required) */}
      <div>
        <label
          htmlFor="Company"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Company Name
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <Building2
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="Company"
            type="text"
            {...register("Company")}
            placeholder="e.g. Apex Fire Equipment Ltd."
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-400 text-gray-900 bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.Company
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          />
        </div>
        {errors.Company && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.Company.message}
          </p>
        )}
      </div>

      {/* Contact Person (Optional) */}
      <div>
        <label
          htmlFor="ContactPerson"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Contact Person
        </label>
        <div className="relative">
          <User
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="ContactPerson"
            type="text"
            {...register("ContactPerson")}
            placeholder="e.g. Robert Vance"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-400 text-gray-900 bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.ContactPerson
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          />
        </div>
        {errors.ContactPerson && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.ContactPerson.message}
          </p>
        )}
      </div>

      {/* Grid: Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label
            htmlFor="Phone"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Phone Number
          </label>
          <div className="relative">
            <PhoneIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="Phone"
              type="text"
              {...register("Phone")}
              placeholder="e.g. +1 555-0192"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-400 text-gray-900 bg-white
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  errors.Phone
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                }`}
            />
          </div>
          {errors.Phone && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.Phone.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="Email"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="Email"
              type="email"
              {...register("Email")}
              placeholder="e.g. sales@apexfire.com"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-400 text-gray-900 bg-white
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  errors.Email
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                }`}
            />
          </div>
          {errors.Email && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.Email.message}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="Address"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Address
        </label>
        <div className="relative">
          <MapPin
            size={15}
            className="absolute left-3 top-3 text-gray-400 pointer-events-none"
          />
          <textarea
            id="Address"
            rows={3}
            {...register("Address")}
            placeholder="e.g. 100 Industrial Parkway, Suite 400"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-400 text-gray-900 bg-white resize-none
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.Address
                  ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          />
        </div>
        {errors.Address && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.Address.message}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700
            transition-colors disabled:opacity-50"
        >
          Reset Form
        </button>

        <div className="flex items-center gap-3">
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
            {isEdit ? "Update Supplier" : "Create Supplier"}
          </button>
        </div>
      </div>
    </form>
  );
}
