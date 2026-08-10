"use client";

// ============================================================
// src/app/(Main)/admin/labour-types/components/LabourTypeForm.tsx
// Create / edit form for a Labour Type.
// ============================================================

import React from "react";

export interface LabourTypeFormValues {
  name: string;
  description: string;
}

interface LabourTypeFormProps {
  initialData?: Partial<LabourTypeFormValues>;
  onSubmit: (data: LabourTypeFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function LabourTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: LabourTypeFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [description, setDescription] = React.useState(initialData?.description ?? "");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Labour type name is required.");
      return;
    }
    await onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#5a657a] mb-1.5 uppercase tracking-wide">
          Type Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electrician, Plumber, Welder"
          className="w-full px-3 py-2.5 text-sm bg-[#161d2e] border border-[#1e2a3d] text-[#dce3ef] placeholder-[#3d4c62] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e02424]/40 focus:border-[#e02424]/60 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#5a657a] mb-1.5 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this labour type"
          rows={3}
          className="w-full px-3 py-2.5 text-sm bg-[#161d2e] border border-[#1e2a3d] text-[#dce3ef] placeholder-[#3d4c62] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e02424]/40 focus:border-[#e02424]/60 transition-colors resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1e2a3d]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-[#5a657a] bg-[#161d2e] hover:bg-[#1e2a3d] rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#cc1f1f] rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {isSubmitting && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {initialData ? "Save Changes" : "Create Type"}
        </button>
      </div>
    </form>
  );
}
