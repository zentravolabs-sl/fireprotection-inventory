"use client";

// ============================================================
// src/app/(Main)/suppliers/components/SupplierTable.tsx
// Updated to camelCase field names (id, company, contactPerson…)
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Building2, User, Phone, Mail, MapPin } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SupplierForm from "./SupplierForm";
import DeleteSupplierDialog from "./DeleteSupplierDialog";
import Pagination from "@/components/ui/Pagination";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SupplierRow,
} from "../actions";
import type { SupplierFormValues } from "@/lib/validations/supplier";

interface SupplierTableProps {
  suppliers: SupplierRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function SupplierTable({
  suppliers,
  total,
  page,
  limit,
  totalPages,
}: SupplierTableProps) {
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Supplier Directory
          </div>
          <button
            id="add-supplier-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Company</th>
                <th className="px-4 py-3 whitespace-nowrap">Contact Person</th>
                <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">Address</th>
                <th className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No suppliers found.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">
                        Add your first supplier
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, idx) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span>{supplier.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {supplier.contactPerson
                        ? <div className="flex items-center gap-1.5"><User size={13} className="text-gray-400" /><span>{supplier.contactPerson}</span></div>
                        : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {supplier.phone
                        ? <div className="flex items-center gap-1.5"><Phone size={13} className="text-emerald-500" /><span>{supplier.phone}</span></div>
                        : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {supplier.email
                        ? <div className="flex items-center gap-1.5"><Mail size={13} className="text-blue-500" /><span className="text-blue-600 dark:text-blue-400">{supplier.email}</span></div>
                        : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-xs truncate">
                      {supplier.address
                        ? <div className="flex items-center gap-1.5 truncate"><MapPin size={13} className="text-gray-400 flex-shrink-0" /><span className="truncate">{supplier.address}</span></div>
                        : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">{formatDate(supplier.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(supplier)}
                        title="Edit supplier"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(supplier)}
                        title="Delete supplier"
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
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
