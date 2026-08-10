"use client";

// ============================================================
// src/app/(Main)/admin/labour/components/LabourForm.tsx
// Create / edit form for a Labour (worker) record.
// ============================================================

import React from "react";

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

  const inputCls = "w-full px-3 py-2.5 text-sm bg-[#161d2e] border border-[#1e2a3d] text-[#dce3ef] placeholder-[#3d4c62] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e02424]/40 focus:border-[#e02424]/60 transition-colors";
  const labelCls = "block text-xs font-semibold text-[#5a657a] mb-1.5 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Worker's full name" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Labour Type <span className="text-red-500">*</span></label>
          <select
            value={labourTypeId}
            onChange={(e) => setLabourTypeId(Number(e.target.value))}
            className={inputCls}
          >
            <option value={0}>— Select Type —</option>
            {labourTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1e2a3d]">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-[#5a657a] bg-[#161d2e] hover:bg-[#1e2a3d] rounded-xl transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#cc1f1f] rounded-xl transition-colors disabled:opacity-60 shadow-sm">
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
