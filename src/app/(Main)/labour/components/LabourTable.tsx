"use client";

// ============================================================
// src/app/(Main)/labour/components/LabourTable.tsx
// Labour Master management table.
// ============================================================

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, UserX, UserCheck, Phone, CreditCard, HardHat } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LabourForm, { type LabourFormValues } from "./LabourForm";
import Pagination from "@/components/ui/Pagination";
import {
  createLabourAction,
  updateLabourAction,
  deactivateLabourAction,
  reactivateLabourAction,
} from "@/app/actions/labour";
import type { LabourRow } from "../actions";

interface Props {
  labours: LabourRow[];
  labourTypes: { id: number; name: string }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(n);
}

export default function LabourTable({
  labours,
  labourTypes,
  total,
  page,
  limit,
  totalPages,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LabourRow | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = useState<LabourRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const openCreate = () => { setEditTarget(undefined); setIsFormOpen(true); };
  const openEdit = (r: LabourRow) => { setEditTarget(r); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditTarget(undefined); };

  const handleSubmit = async (data: LabourFormValues) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", data.name);
      fd.set("labourTypeId", String(data.labourTypeId));
      fd.set("nic", data.nic);
      fd.set("phone", data.phone);
      fd.set("monthlySalary", String(data.monthlySalary));
      if (editTarget) fd.set("id", String(editTarget.id));

      const result = editTarget ? await updateLabourAction(fd) : await createLabourAction(fd);
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
      ? await deactivateLabourAction(toggleTarget.id)
      : await reactivateLabourAction(toggleTarget.id);
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
            Labour Master Directory
          </div>
          <button
            id="add-labour-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Register Labour</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Code</th>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 whitespace-nowrap">NIC</th>
                <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 whitespace-nowrap">Monthly Salary</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Projects</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Added</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {labours.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <HardHat size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No labour records found.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">Register the first labourer</button>
                    </div>
                  </td>
                </tr>
              ) : (
                labours.map((labour, idx) => (
                  <tr key={labour.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{labour.labourCode}</td>

                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                            {labour.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {labour.name}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                        {labour.labourType.name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {labour.nic ? (
                        <div className="flex items-center gap-1">
                          <CreditCard size={12} className="text-gray-400" />
                          {labour.nic}
                        </div>
                      ) : <span className="text-gray-400 italic">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {labour.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" />
                          {labour.phone}
                        </div>
                      ) : <span className="text-gray-400 italic">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-gray-900 dark:text-gray-100 font-semibold whitespace-nowrap">
                      {labour.monthlySalary > 0 ? formatCurrency(labour.monthlySalary) : <span className="text-gray-400 italic">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-gray-900 dark:text-gray-100 font-bold">{labour._count.projectLabours}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${labour.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60" : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}>
                        {labour.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(labour.createdAt)}</td>

                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(labour)}
                        title="Edit"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setToggleTarget(labour)}
                        title={labour.isActive ? "Deactivate" : "Reactivate"}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 ${labour.isActive ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"}`}
                      >
                        {labour.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        <span>{labour.isActive ? "Deactivate" : "Reactivate"}</span>
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

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Labour Record" : "Register New Labour"} maxWidth="max-w-lg">
        <LabourForm
          initialData={editTarget ? { name: editTarget.name, labourTypeId: editTarget.labourType.id, nic: editTarget.nic ?? "", phone: editTarget.phone ?? "", monthlySalary: editTarget.monthlySalary } : undefined}
          labourTypes={labourTypes}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(undefined)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? "Deactivate Labour" : "Reactivate Labour"}
        description={
          toggleTarget?.isActive
            ? `Deactivate "${toggleTarget?.name}"? They cannot be assigned to new projects while inactive.`
            : `Reactivate "${toggleTarget?.name}"?`
        }
        confirmText={toggleTarget?.isActive ? "Deactivate" : "Reactivate"}
        variant={toggleTarget?.isActive ? "danger" : "info"}
        isLoading={isToggling}
      />
    </>
  );
}
