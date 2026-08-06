"use client";

// ============================================================
// src/components/projects/AssignEngineerModal.tsx
// Modal dialog to assign engineers with Lead toggle
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { assignEngineerAction } from "@/app/actions/projects";

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface AssignEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  engineers: UserOption[];
}

export function AssignEngineerModal({
  isOpen,
  onClose,
  projectId,
  engineers,
}: AssignEngineerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());

    const res = await assignEngineerAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Engineer to Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Engineer *
          </label>
          <select
            name="engineerId"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
          >
            <option value="">Choose an active engineer...</option>
            {engineers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="isLead"
            name="isLead"
            value="true"
            className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
          />
          <label htmlFor="isLead" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
            Designate as Lead Engineer ⭐
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancel
          </button>
          <FormButton loading={loading}>Assign Engineer</FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AssignEngineerModal;
