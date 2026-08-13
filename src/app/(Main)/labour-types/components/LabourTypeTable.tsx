"use client";

// ============================================================
// src/app/(Main)/labour-types/components/LabourTypeTable.tsx
// Data table for Labour Types — create, edit, deactivate/restore.
// ============================================================

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Tag, ToggleLeft, ToggleRight, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LabourTypeForm, { type LabourTypeFormValues } from "./LabourTypeForm";
import Pagination from "@/components/ui/Pagination";
import {
  createLabourTypeAction,
  updateLabourTypeAction,
  deleteLabourTypeAction,
  restoreLabourTypeAction,
} from "@/app/actions/labour";
import type { LabourTypeRow } from "../actions";

interface Props {
  labourTypes: LabourTypeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(d)
  );
}

export default function LabourTypeTable({
  labourTypes,
  total,
  page,
  limit,
  totalPages,
}: Props) {
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Labour Type Directory
          </div>
          <button
            id="add-labour-type-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add Labour Type</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Type Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Description</th>
                <th className="px-4 py-3 whitespace-nowrap">Labours</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {labourTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Tag size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No labour types yet.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">
                        Add the first type
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                labourTypes.map((lt, idx) => (
                  <tr key={lt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center flex-shrink-0">
                          <Tag size={13} className="text-red-600 dark:text-red-400" />
                        </div>
                        <span>{lt.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {lt.description || <span className="text-gray-400 italic">No description</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">{lt._count.labours}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          lt.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                        }`}
                      >
                        {lt.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(lt.createdAt)}</td>

                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(lt)}
                        title="Edit"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setToggleTarget(lt)}
                        title={lt.isActive ? "Deactivate" : "Restore"}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 ${
                          lt.isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}
                      >
                        {lt.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        <span>{lt.isActive ? "Deactivate" : "Restore"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={total}
          limit={limit}
        />
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
