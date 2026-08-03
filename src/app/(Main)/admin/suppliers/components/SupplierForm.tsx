"use client";

// ============================================================
// src/app/(Main)/admin/suppliers/components/SupplierForm.tsx
// Updated field names: company, contactPerson, phone, email, address
// ============================================================

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, User, Phone as PhoneIcon, Mail, MapPin } from "lucide-react";
import { supplierSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import type { SupplierRow } from "../actions";

interface SupplierFormProps {
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
      company: initialData?.company ?? "",
      contactPerson: initialData?.contactPerson ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      address: initialData?.address ?? "",
    },
  });

  useEffect(() => {
    reset({
      company: initialData?.company ?? "",
      contactPerson: initialData?.contactPerson ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      address: initialData?.address ?? "",
    });
  }, [initialData, reset]);

  const inputClass = (hasError: boolean) =>
    `w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-400 text-gray-900 bg-white
    disabled:opacity-60 disabled:cursor-not-allowed
    ${hasError
      ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
      : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Company Name */}
      <div>
        <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="company"
            type="text"
            {...register("company")}
            placeholder="e.g. Apex Fire Equipment Ltd."
            disabled={isSubmitting}
            className={inputClass(!!errors.company)}
          />
        </div>
        {errors.company && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.company.message}</p>}
      </div>

      {/* Contact Person */}
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Person</label>
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="contactPerson"
            type="text"
            {...register("contactPerson")}
            placeholder="e.g. Robert Vance"
            disabled={isSubmitting}
            className={inputClass(!!errors.contactPerson)}
          />
        </div>
        {errors.contactPerson && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.contactPerson.message}</p>}
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
          <div className="relative">
            <PhoneIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="phone"
              type="text"
              {...register("phone")}
              placeholder="e.g. +1 555-0192"
              disabled={isSubmitting}
              className={inputClass(!!errors.phone)}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              {...register("email")}
              placeholder="e.g. sales@apexfire.com"
              disabled={isSubmitting}
              className={inputClass(!!errors.email)}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
          <textarea
            id="address"
            rows={3}
            {...register("address")}
            placeholder="e.g. 100 Industrial Parkway, Suite 400"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-400 text-gray-900 bg-white resize-none
              disabled:opacity-60 disabled:cursor-not-allowed
              ${errors.address
                ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              }`}
          />
        </div>
        {errors.address && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.address.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting}
          className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Reset Form
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
            {isEdit ? "Update Supplier" : "Create Supplier"}
          </button>
        </div>
      </div>
    </form>
  );
}
