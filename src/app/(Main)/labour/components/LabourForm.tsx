"use client";

// ============================================================
// src/app/(Main)/labour/components/LabourForm.tsx
// Create / edit form for a Labour (worker) record.
// ============================================================

import React from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";

export interface LabourFormValues {
  name: string;
  labourTypeId: number;
  nic: string;
  phone: string;
  monthlySalary: number;
}

interface Props {
  initialData?: Partial<LabourFormValues>;
  labourTypes: { id: number; name: string }[];
  onSubmit: (data: LabourFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function LabourForm({ initialData, labourTypes, onSubmit, onCancel, isSubmitting }: Props) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [labourTypeId, setLabourTypeId] = React.useState<number>(initialData?.labourTypeId ?? 0);
  const [nic, setNic] = React.useState(initialData?.nic ?? "");
  const [phone, setPhone] = React.useState(initialData?.phone ?? "");
  const [monthlySalary, setMonthlySalary] = React.useState<number>(initialData?.monthlySalary ?? 0);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!labourTypeId) { setError("Select a labour type."); return; }
    await onSubmit({ name: name.trim(), labourTypeId, nic: nic.trim(), phone: phone.trim(), monthlySalary });
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 placeholder-gray-400 dark:placeholder-gray-500";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Full Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Worker's full name" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Labour Type *</label>
          <Select
            instanceId="labour-type-select"
            options={labourTypes.map((t) => ({ value: t.id, label: t.name }))}
            value={labourTypes.filter((t) => t.id === labourTypeId).map((t) => ({ value: t.id, label: t.name }))[0] || null}
            onChange={(val) => setLabourTypeId(val ? val.value : 0)}
            placeholder="— Select Type —"
            isSearchable
            isClearable
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
        </div>

        <div>
          <label className={labelCls}>Monthly Salary (LKR)</label>
          <input
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value))}
            min={0}
            step={0.01}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>NIC / ID Number</label>
          <input type="text" value={nic} onChange={(e) => setNic(e.target.value)} placeholder="National ID or passport" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 77 000 0000" className={inputCls} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="w-44 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60">
          {isSubmitting && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {initialData ? "Save Changes" : "Register Labour"}
        </button>
      </div>
    </form>
  );
}
