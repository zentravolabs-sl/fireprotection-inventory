"use client";

// ============================================================
// src/app/(Main)/admin/labour-types/components/LabourTypeTable.tsx
// Data table for Labour Types — create, edit, deactivate/restore.
// ============================================================

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Tag, ToggleLeft, ToggleRight, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LabourTypeForm, { type LabourTypeFormValues } from "./LabourTypeForm";
import {
  createLabourTypeAction,
  updateLabourTypeAction,
  deleteLabourTypeAction,
  restoreLabourTypeAction,
} from "@/app/actions/labour";
import type { LabourTypeRow } from "../actions";

interface Props {
  labourTypes: LabourTypeRow[];
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(d)
  );
}

export default function LabourTypeTable({ labourTypes }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LabourTypeRow | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = useState<LabourTypeRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };
  const openEdit = (row: LabourTypeRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: LabourTypeFormValues) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      fd.set("description", data.description);
      if (editTarget) fd.set("id", String(editTarget.id));

      const result = editTarget
        ? await updateLabourTypeAction(fd)
        : await createLabourTypeAction(fd);

      if (result.success) {
        toast.success(result.message);
        closeForm();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    const result = toggleTarget.isActive
      ? await deleteLabourTypeAction(toggleTarget.id)
      : await restoreLabourTypeAction(toggleTarget.id);
    setIsToggling(false);
    if (result.success) {
      toast.success(result.message);
      setToggleTarget(undefined);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      {/* Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          id="add-labour-type-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#cc1f1f] rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Labour Type
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-10">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Type Name</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Description</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Labours</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Created</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide sticky right-0 bg-[#080c12]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {labourTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Tag size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No labour types yet.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">
                        Add the first type
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                labourTypes.map((lt, idx) => (
                  <tr key={lt.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-4 py-3.5 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#e02424]/10 flex items-center justify-center flex-shrink-0">
                          <Tag size={12} className="text-[#e02424]" />
                        </div>
                        <span className="font-semibold text-[#dce3ef]">{lt.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] max-w-xs truncate">
                      {lt.description || <span className="text-[#3d4c62] italic">No description</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-[#3d4c62]" />
                        <span className="text-[#dce3ef] font-semibold">{lt._count.labours}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          lt.isActive
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                            : "bg-gray-900/60 text-gray-400 border-gray-700/60"
                        }`}
                      >
                        {lt.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a]">{formatDate(lt.createdAt)}</td>

                    <td className="px-4 py-3.5 sticky right-0 bg-[#0d1117] group-hover:bg-[#161d2e] transition-colors">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(lt)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleTarget(lt)}
                          title={lt.isActive ? "Deactivate" : "Restore"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            lt.isActive
                              ? "text-[#5a657a] hover:text-amber-400 hover:bg-amber-900/30"
                              : "text-[#5a657a] hover:text-emerald-400 hover:bg-emerald-900/30"
                          }`}
                        >
                          {lt.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {labourTypes.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50 flex items-center justify-between">
            <p className="text-xs text-[#3d4c62] font-medium">
              {labourTypes.length} type{labourTypes.length !== 1 ? "s" : ""} total ·{" "}
              {labourTypes.filter((t) => t.isActive).length} active
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Labour Type" : "Add Labour Type"} maxWidth="max-w-md">
        <LabourTypeForm
          initialData={editTarget ? { name: editTarget.name, description: editTarget.description ?? "" } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Toggle confirm */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(undefined)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? "Deactivate Labour Type" : "Restore Labour Type"}
        description={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.name}"? Existing labour records will NOT be deleted.`
            : `Restore "${toggleTarget?.name}" so it can be used again?`
        }
        confirmText={toggleTarget?.isActive ? "Deactivate" : "Restore"}
        variant={toggleTarget?.isActive ? "warning" : "info"}
        isLoading={isToggling}
      />
    </>
  );
}
