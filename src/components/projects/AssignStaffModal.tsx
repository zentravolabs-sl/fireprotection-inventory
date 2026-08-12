"use client";

// ============================================================
// src/components/projects/AssignStaffModal.tsx
// Modal dialog to update PM & Engineer assignments
// ============================================================

import React, { useState } from "react";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
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
  const [pmId, setPmId] = useState<string>(currentPmId || "");
  const [engineerId, setEngineerId] = useState<string>(currentEngineerId || "");

  const pmOptions = users.filter(
    (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );
  const engineerOptions = users.filter(
    (u) => u.role === "ENGINEER" || u.role === "PROJECT_MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pmId) {
      setError("Please select a Project Manager.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("projectId", projectId.toString());
    formData.set("projectManagerId", pmId);
    formData.set("engineerId", engineerId);

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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Project Manager *
          </label>
          <Select
            instanceId="assign-pm-select"
            options={pmOptions.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            value={pmOptions.filter((u) => u.id === pmId).map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))[0] || null}
            onChange={(val) => setPmId(val ? val.value : "")}
            placeholder="Select PM..."
            isSearchable
            isClearable
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Site Engineer
          </label>
          <Select
            instanceId="assign-engineer-select"
            options={engineerOptions.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            value={engineerOptions.filter((u) => u.id === engineerId).map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))[0] || null}
            onChange={(val) => setEngineerId(val ? val.value : "")}
            placeholder="Select Engineer..."
            isSearchable
            isClearable
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={getCustomSelectStyles()}
          />
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
            Save Assignments
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}
