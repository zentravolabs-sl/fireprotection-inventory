"use client";

// ============================================================
// src/components/projects/ProjectFormModal.tsx
// Modal dialog to create a new project with Zod validations
// ============================================================

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select, { StylesConfig } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createProjectAction } from "@/app/actions/projects";
import {
  createProjectSchema,
  type CreateProjectInput,
  type CreateProjectFormValues,
} from "@/lib/validations/project";

interface CustomerOption {
  id: number;
  companyName: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  users: UserOption[];
  userRole?: string;
}

const formatDateToString = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseStringToDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

const getCustomSelectStyles = (hasError?: boolean): StylesConfig<SelectOption<any>, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: "46px",
    borderRadius: "0.75rem",
    borderColor: hasError
      ? "#f87171"
      : state.isFocused
        ? "#ef4444"
        : "#374151",
    boxShadow: hasError
      ? "0 0 0 1px #f87171"
      : state.isFocused
        ? "0 0 0 1px #ef4444"
        : "none",
    "&:hover": {
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#ef4444"
          : "#4b5563",
    },
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#ef4444" : "#9ca3af",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#9ca3af",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    fontSize: "0.875rem",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#dc2626"
      : state.isFocused
        ? "#7f1d1d"
        : "#1f2937",
    color: "#f9fafb",
    cursor: "pointer",
    fontSize: "0.875rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#f9fafb",
  }),
  input: (base) => ({
    ...base,
    color: "#f9fafb",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
});

export function ProjectFormModal({
  isOpen,
  onClose,
  customers,
  users,
  userRole,
}: ProjectFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const pmOptions = users.filter((u) => u.role === "PROJECT_MANAGER");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateProjectFormValues, any, CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
      customerId: undefined,
      projectManagerId: "",
      projectType: "PRIVATE",
      location: "",
      startDate: "",
      endDate: "",
      projectValue: 0,
      estimatedMaterialCost: 0,
      estimatedLabourCost: 0,
      estimatedTransportCost: 0,
      estimatedEquipmentCost: 0,
      estimatedOtherCost: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        projectName: "",
        customerId: undefined,
        projectManagerId: "",
        projectType: "PRIVATE",
        location: "",
        startDate: "",
        endDate: "",
        projectValue: 0,
        estimatedMaterialCost: 0,
        estimatedLabourCost: 0,
        estimatedTransportCost: 0,
        estimatedEquipmentCost: 0,
        estimatedOtherCost: 0,
        description: "",
      });
      setServerError(null);
    }
  }, [isOpen, reset]);

  const handleModalClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  async function onSubmit(data: CreateProjectInput) {
    setLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("projectName", data.projectName);
    formData.append("customerId", String(data.customerId));
    formData.append("projectManagerId", data.projectManagerId);
    formData.append("projectType", data.projectType ?? "PRIVATE");
    if (data.location) formData.append("location", data.location);
    if (data.startDate) formData.append("startDate", data.startDate);
    if (data.endDate) formData.append("endDate", data.endDate);
    if (data.description) formData.append("description", data.description);
    formData.append("projectValue", String(data.projectValue ?? 0));
    formData.append("estimatedMaterialCost", String(data.estimatedMaterialCost ?? 0));
    formData.append("estimatedLabourCost", String(data.estimatedLabourCost ?? 0));
    formData.append("estimatedTransportCost", String(data.estimatedTransportCost ?? 0));
    formData.append("estimatedEquipmentCost", String(data.estimatedEquipmentCost ?? 0));
    formData.append("estimatedOtherCost", String(data.estimatedOtherCost ?? 0));

    const res = await createProjectAction(formData);

    setLoading(false);

    if (res.success) {
      handleModalClose();
    } else {
      setServerError(res.message);
    }
  }

  const customerSelectOptions: SelectOption<number>[] = customers.map((c) => ({
    value: c.id,
    label: c.companyName,
  }));

  const pmSelectOptions: SelectOption<string>[] = pmOptions.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.role})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Create New Project" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {serverError}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div className="md:col-span-2">
            <FormInput
              label="Project Name *"
              placeholder="e.g. Metro Station Fire Suppression Installation"
              {...register("projectName")}
              error={errors.projectName?.message}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Customer *
            </label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => {
                const selectedOption =
                  customerSelectOptions.find((opt) => opt.value === field.value) || null;
                return (
                  <Select
                    instanceId="customer-select"
                    classNamePrefix="react-select"
                    options={customerSelectOptions}
                    value={selectedOption}
                    onChange={(val) => field.onChange(val ? val.value : undefined)}
                    placeholder="Search & Select Customer..."
                    isSearchable
                    isClearable
                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                    styles={getCustomSelectStyles(!!errors.customerId)}
                  />
                );
              }}
            />
            {errors.customerId && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Project Manager *
            </label>
            <Controller
              name="projectManagerId"
              control={control}
              render={({ field }) => {
                const selectedOption =
                  pmSelectOptions.find((opt) => opt.value === field.value) || null;
                return (
                  <Select
                    instanceId="pm-select"
                    classNamePrefix="react-select"
                    options={pmSelectOptions}
                    value={selectedOption}
                    onChange={(val) => field.onChange(val ? val.value : "")}
                    placeholder="Search & Select PM..."
                    isSearchable
                    isClearable
                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                    styles={getCustomSelectStyles(!!errors.projectManagerId)}
                  />
                );
              }}
            />
            {errors.projectManagerId && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.projectManagerId.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <FormInput
              label="Location / Site Address"
              placeholder="e.g. Block B, Tech Park, City"
              {...register("location")}
              error={errors.location?.message}
            />
          </div>

          {/* Project Type */}
          <div className="md:col-span-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Project Type *
            </label>
            <Controller
              name="projectType"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  {(userRole === "QS_ENGINEER" ? (["PRIVATE"] as const) : (["GOVERNMENT", "PRIVATE"] as const)).map((type) => {
                    const isSelected = field.value === type;
                    const icon = type === "GOVERNMENT" ? "🏛️" : "🏢";
                    const label = type === "GOVERNMENT" ? "Government" : "Private";
                    const accent =
                      type === "GOVERNMENT"
                        ? isSelected
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 hover:border-blue-500/50 text-gray-400"
                        : isSelected
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : "border-gray-700 hover:border-red-500/50 text-gray-400";
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${accent}`}
                      >
                        <span className="text-xl">{icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs opacity-70">
                            {type === "GOVERNMENT" ? "Govt. / Municipal contract" : "Commercial / private sector"}
                          </p>
                        </div>
                        <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? type === "GOVERNMENT"
                              ? "border-blue-500 bg-blue-500"
                              : "border-red-500 bg-red-500"
                            : "border-gray-600"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.projectType && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.projectType.message}
              </p>
            )}
          </div>
        </div>

        {/* Timeline & Project Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Start Date
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  selected={parseStringToDate(field.value)}
                  onChange={(date: Date | null) => field.onChange(formatDateToString(date))}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date..."
                  isClearable
                  showPopperArrow={false}
                  className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none transition-all duration-200 ${errors.startDate
                      ? "border-red-400 ring-1 ring-red-300 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                    }`}
                  wrapperClassName="w-full"
                />
              )}
            />
            {errors.startDate && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              End Date
            </label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  selected={parseStringToDate(field.value)}
                  onChange={(date: Date | null) => field.onChange(formatDateToString(date))}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select end date..."
                  isClearable
                  showPopperArrow={false}
                  className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none transition-all duration-200 ${errors.endDate
                      ? "border-red-400 ring-1 ring-red-300 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
                    }`}
                  wrapperClassName="w-full"
                />
              )}
            />
            {errors.endDate && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.endDate.message}
              </p>
            )}
          </div>

          <FormInput
            label="Project Value (LKR) *"
            type="number"
            step="any"
            placeholder="e.g. 500000"
            {...register("projectValue")}
            error={errors.projectValue?.message}
          />
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-200/80 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Estimated Cost Breakdown (LKR)
            </h4>
            <span className="text-xs text-gray-400">Initial cost estimates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <FormInput
              label="Est. Material"
              type="number"
              step="any"
              {...register("estimatedMaterialCost")}
              error={errors.estimatedMaterialCost?.message}
            />
            <FormInput
              label="Est. Labour"
              type="number"
              step="any"
              {...register("estimatedLabourCost")}
              error={errors.estimatedLabourCost?.message}
            />
            <FormInput
              label="Est. Transport"
              type="number"
              step="any"
              {...register("estimatedTransportCost")}
              error={errors.estimatedTransportCost?.message}
            />
            <FormInput
              label="Est. Equipment"
              type="number"
              step="any"
              {...register("estimatedEquipmentCost")}
              error={errors.estimatedEquipmentCost?.message}
            />
            <FormInput
              label="Est. Other"
              type="number"
              step="any"
              {...register("estimatedOtherCost")}
              error={errors.estimatedOtherCost?.message}
            />
          </div>
        </div>

        {/* Description / Scope */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Description / Scope of Work
          </label>
          <textarea
            rows={2}
            {...register("description")}
            className={`w-full px-4 py-2.5 border rounded-xl bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none transition-all duration-200 ${errors.description
                ? "border-red-400 ring-1 ring-red-300 focus:border-red-500 focus:ring-red-300"
                : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
              }`}
            placeholder="Brief scope, specifications, or notes..."
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={handleModalClose}
            className="w-40 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
          >
            Cancel
          </button>
          <FormButton
            loading={loading}
            fullWidth={false}
            className="w-40"
          >
            Create Project
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default ProjectFormModal;

