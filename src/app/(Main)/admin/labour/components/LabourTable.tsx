"use client";

// ============================================================
// src/app/(Main)/admin/labour/components/LabourTable.tsx
// Labour Master management table.
// ============================================================

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, UserX, UserCheck, Phone, CreditCard, HardHat } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LabourForm, { type LabourFormValues } from "./LabourForm";
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
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(n);
}

export default function LabourTable({ labours, labourTypes }: Props) {
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
      <div className="mb-6 flex items-center justify-between">
        <button
          id="add-labour-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#cc1f1f] rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Register Labour
        </button>
      </div>

      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                {["#", "Code", "Name", "Type", "NIC", "Phone", "Monthly Salary", "Projects", "Status", "Added", "Actions"].map((h) => (
                  <th key={h} className={`px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-right sticky right-0 bg-[#080c12]" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {labours.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <HardHat size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No labour records found.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">Register the first labourer</button>
                    </div>
                  </td>
                </tr>
              ) : (
                labours.map((labour, idx) => (
                  <tr key={labour.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-4 py-3.5 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-mono font-bold text-[#e02424] whitespace-nowrap">{labour.labourCode}</td>

                    <td className="px-4 py-3.5 font-semibold text-[#dce3ef] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e02424]/20 to-[#ff6b6b]/10 border border-[#e02424]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#e02424]">
                            {labour.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {labour.name}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-1 text-[11px] font-semibold bg-[#161d2e] text-[#5a657a] border border-[#1e2a3d] rounded-lg">
                        {labour.labourType.name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      {labour.nic ? (
                        <div className="flex items-center gap-1">
                          <CreditCard size={11} className="text-[#3d4c62]" />
                          {labour.nic}
                        </div>
                      ) : <span className="text-[#3d4c62]">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      {labour.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={11} className="text-[#3d4c62]" />
                          {labour.phone}
                        </div>
                      ) : <span className="text-[#3d4c62]">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-[#dce3ef] font-semibold whitespace-nowrap">
                      {labour.monthlySalary > 0 ? formatCurrency(labour.monthlySalary) : <span className="text-[#3d4c62]">—</span>}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-[#dce3ef] font-bold">{labour._count.projectLabours}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${labour.isActive ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" : "bg-gray-900/60 text-gray-400 border-gray-700/60"}`}>
                        {labour.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">{formatDate(labour.createdAt)}</td>

                    <td className="px-4 py-3.5 sticky right-0 bg-[#0d1117] group-hover:bg-[#161d2e] transition-colors">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => openEdit(labour)} title="Edit"
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => setToggleTarget(labour)}
                          title={labour.isActive ? "Deactivate" : "Reactivate"}
                          className={`p-1.5 rounded-lg transition-colors ${labour.isActive ? "text-[#5a657a] hover:text-red-400 hover:bg-red-900/30" : "text-[#5a657a] hover:text-emerald-400 hover:bg-emerald-900/30"}`}>
                          {labour.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {labours.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50">
            <p className="text-xs text-[#3d4c62] font-medium">
              {labours.length} record{labours.length !== 1 ? "s" : ""} ·{" "}
              {labours.filter((l) => l.isActive).length} active
            </p>
          </div>
        )}
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
