"use client";

// ============================================================
// src/app/(Main)/admin/customers/components/CustomerForm.tsx
// React Hook Form + Zod for Customer management.
// ============================================================

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building, User, Phone, Mail, MapPin } from "lucide-react";
import { z } from "zod";
import { customerSchema, type CustomerFormValues } from "@/lib/validations/customer";
import type { CustomerRow } from "../actions";

interface CustomerFormProps {
  initialData?: CustomerRow;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CustomerFormProps) {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof customerSchema>, any, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      CompanyName: initialData?.CompanyName ?? "",
      ContactPerson: initialData?.ContactPerson ?? "",
      Phone: initialData?.Phone ?? "",
      Email: initialData?.Email ?? "",
      Address: initialData?.Address ?? "",
    },
  });

  useEffect(() => {
    reset({
      CompanyName: initialData?.CompanyName ?? "",
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
        <label htmlFor="CompanyName" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="CompanyName"
            type="text"
            {...register("CompanyName")}
            placeholder="e.g. Acme Fire Safety Ltd"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white disabled:opacity-60 ${
              errors.CompanyName
                ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            }`}
          />
        </div>
        {errors.CompanyName && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.CompanyName.message}</p>}
      </div>

      {/* Contact Person & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contact Person */}
        <div>
          <label htmlFor="ContactPerson" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Contact Person (Optional)
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="ContactPerson"
              type="text"
              {...register("ContactPerson")}
              placeholder="e.g. John Doe"
              disabled={isSubmitting}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white text-gray-900"
            />
          </div>
          {errors.ContactPerson && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.ContactPerson.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="Phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="Phone"
              type="tel"
              {...register("Phone")}
              placeholder="e.g. +94 77 123 4567"
              disabled={isSubmitting}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white text-gray-900"
            />
          </div>
          {errors.Phone && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Phone.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="Email" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email Address (Optional)
        </label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="Email"
            type="email"
            {...register("Email")}
            placeholder="e.g. info@acmefire.com"
            disabled={isSubmitting}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 bg-white ${
              errors.Email
                ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            }`}
          />
        </div>
        {errors.Email && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Email.message}</p>}
      </div>

      {/* Address Textarea */}
      <div>
        <label htmlFor="Address" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Address (Optional)
        </label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
          <textarea
            id="Address"
            rows={3}
            {...register("Address")}
            placeholder="e.g. 123 Industrial Zone, Colombo 03"
            disabled={isSubmitting}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white text-gray-900 resize-none"
          />
        </div>
        {errors.Address && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.Address.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
            {isEdit ? "Update Customer" : "Create Customer"}
          </button>
        </div>
      </div>
    </form>
  );
}
