"use client";

// ============================================================
// src/components/projects/AssignEngineerModal.tsx
// Modal dialog to assign engineers with Lead toggle
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
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
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEngineerId) {
      setError("Please select an engineer.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId.toString());
    formData.set("engineerId", selectedEngineerId);

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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Select Engineer *
          </label>
          <Select
            instanceId="assign-engineer-select"
            options={engineers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            value={engineers.filter((u) => u.id === selectedEngineerId).map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))[0] || null}
            onChange={(val) => setSelectedEngineerId(val ? val.value : "")}
            placeholder="Choose an active engineer..."
            isSearchable
            isClearable
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
        </div>

        <div className="flex items-center space-x-2.5 pt-2">
          <input
            type="checkbox"
            id="isLead"
            name="isLead"
            value="true"
            className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
          />
          <label htmlFor="isLead" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
            Designate as Lead Engineer ⭐
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center whitespace-nowrap"
          >
            Cancel
          </button>
          <FormButton loading={loading} fullWidth={false} className="w-40">
            Assign Engineer
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AssignEngineerModal;
