"use client";

// ============================================================
// src/components/projects/AssignStaffModal.tsx
// Modal dialog to update PM & Engineer assignments
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { assignStaffAction } from "@/app/actions/projects";

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentPmId?: string;
  currentEngineerId?: string | null;
  users: UserOption[];
}

export function AssignStaffModal({
  isOpen,
  onClose,
  projectId,
  currentPmId,
  currentEngineerId,
  users,
}: AssignStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pmOptions = users.filter(
    (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );
  const engineerOptions = users.filter(
    (u) => u.role === "ENGINEER" || u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());

    const res = await assignStaffAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign / Reassign Project Staff">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Manager *
          </label>
          <select
            name="projectManagerId"
            defaultValue={currentPmId || ""}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Site Engineer
          </label>
          <select
            name="engineerId"
            defaultValue={currentEngineerId || ""}
            className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select Engineer...</option>
            {engineerOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancel
          </button>
          <FormButton loading={loading}>Save Assignments</FormButton>
        </div>
      </form>
    </Modal>
  );
}
