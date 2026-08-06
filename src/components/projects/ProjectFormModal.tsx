"use client";

// ============================================================
// src/components/projects/ProjectFormModal.tsx
// Modal dialog to create a new project with cost estimates
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { FormButton } from "@/components/ui/FormButton";
import { createProjectAction } from "@/app/actions/projects";

interface CustomerOption {
  id: number;
  companyName: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  users: UserOption[];
}

export function ProjectFormModal({
  isOpen,
  onClose,
  customers,
  users,
}: ProjectFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pmOptions = users.filter(
    (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createProjectAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <FormInput
          label="Project Name *"
          name="projectName"
          placeholder="e.g. Metro Station Fire Suppression Installation"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <select
              name="customerId"
              required
              className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Manager *
            </label>
            <select
              name="projectManagerId"
              required
              className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select PM...</option>
              {pmOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <FormInput
          label="Location / Site Address"
          name="location"
          placeholder="e.g. Block B, Tech Park, City"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Start Date" name="startDate" type="date" />
          <FormInput label="End Date" name="endDate" type="date" />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-3">
          <FormInput
            label="Project Value (LKR) — Contract Value / Customer Price *"
            name="projectValue"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 500000"
            required
          />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Estimated Cost Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormInput label="Est. Material Cost" name="estimatedMaterialCost" type="number" min="0" defaultValue="0" />
              <FormInput label="Est. Labour Cost" name="estimatedLabourCost" type="number" min="0" defaultValue="0" />
              <FormInput label="Est. Transport Cost" name="estimatedTransportCost" type="number" min="0" defaultValue="0" />
              <FormInput label="Est. Equipment Cost" name="estimatedEquipmentCost" type="number" min="0" defaultValue="0" />
              <FormInput label="Est. Other Cost" name="estimatedOtherCost" type="number" min="0" defaultValue="0" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description / Scope of Work
          </label>
          <textarea
            name="description"
            rows={2}
            className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Brief scope, specifications, or notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancel
          </button>
          <FormButton loading={loading}>Create Project</FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default ProjectFormModal;
