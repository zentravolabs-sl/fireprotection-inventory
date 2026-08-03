"use client";

// ============================================================
// src/app/(Main)/admin/suppliers/components/SupplierTable.tsx
// Updated to camelCase field names (id, company, contactPerson…)
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Building2, User, Phone, Mail, MapPin } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SupplierForm from "./SupplierForm";
import DeleteSupplierDialog from "./DeleteSupplierDialog";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SupplierRow,
} from "../actions";
import type { SupplierFormValues } from "@/lib/validations/supplier";

interface SupplierTableProps {
  suppliers: SupplierRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function SupplierTable({ suppliers }: SupplierTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupplierRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => { setEditTarget(undefined); setIsFormOpen(true); };
  const openEdit = (row: SupplierRow) => { setEditTarget(row); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditTarget(undefined); };

  const handleFormSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateSupplier({ ...data, id: editTarget.id })
        : await createSupplier(data);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteSupplier(deleteTarget.id);
    if (result.success) {
      toast.success(result.message);
      setDeleteTarget(undefined);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="mb-6">
        <button
          id="add-supplier-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
            bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Supplier
        </button>
      </div>

      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                {["#", "Company", "Contact Person", "Phone", "Email", "Address", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide first:w-12 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Building2 size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No suppliers found.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">
                        Add your first supplier
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, idx) => (
                  <tr key={supplier.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-6 py-4 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-[#e02424] flex-shrink-0" />
                        <span className="font-semibold text-[#dce3ef]">{supplier.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#dce3ef]">
                      {supplier.contactPerson
                        ? <div className="flex items-center gap-1.5"><User size={13} className="text-[#5a657a]" /><span>{supplier.contactPerson}</span></div>
                        : <span className="text-[#3d4c62] italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[#dce3ef]">
                      {supplier.phone
                        ? <div className="flex items-center gap-1.5"><Phone size={13} className="text-[#5a657a]" /><span>{supplier.phone}</span></div>
                        : <span className="text-[#3d4c62] italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[#dce3ef]">
                      {supplier.email
                        ? <div className="flex items-center gap-1.5"><Mail size={13} className="text-[#5a657a]" /><span>{supplier.email}</span></div>
                        : <span className="text-[#3d4c62] italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden lg:table-cell max-w-xs truncate">
                      {supplier.address
                        ? <div className="flex items-center gap-1.5 truncate"><MapPin size={13} className="text-[#5a657a] flex-shrink-0" /><span className="truncate">{supplier.address}</span></div>
                        : <span className="text-[#3d4c62] italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden xl:table-cell">{formatDate(supplier.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(supplier)}
                          title="Edit supplier"
                          className="p-2 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(supplier)}
                          title="Delete supplier"
                          className="p-2 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {suppliers.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50">
            <p className="text-xs text-[#3d4c62] font-medium">
              {suppliers.length} {suppliers.length === 1 ? "supplier" : "suppliers"} total
            </p>
          </div>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Supplier" : "Add Supplier"}>
        <SupplierForm
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <DeleteSupplierDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        companyName={deleteTarget?.company}
      />
    </>
  );
}
