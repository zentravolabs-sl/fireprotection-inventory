"use client";

// ============================================================
// src/app/(Main)/admin/customers/components/CustomerTable.tsx
// Data table for Customers module with modal dialogs and toast notifications.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Building, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Modal from "@/components/ui/Modal";
import CustomerForm from "./CustomerForm";
import DeleteCustomerDialog from "./DeleteCustomerDialog";
import { createCustomer, updateCustomer, deleteCustomer, type CustomerRow } from "../actions";
import type { CustomerFormValues } from "@/lib/validations/customer";

interface CustomerTableProps {
  customers: CustomerRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function CustomerTable({ customers }: CustomerTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: CustomerRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateCustomer({ ...data, id: editTarget.id })
        : await createCustomer(data);

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
    const result = await deleteCustomer(deleteTarget.id);
    if (result.success) {
      toast.success(result.message);
      setDeleteTarget(undefined);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <button
          id="add-customer-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add New Customer
        </button>
      </div>

      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-10">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Company Name</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Contact Person</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Phone</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Email</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Address</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap sticky right-0 bg-[#080c12]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Building size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No customers match your search criteria.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">
                        Add a new customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, idx) => (
                  <tr key={customer.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-4 py-3.5 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-bold text-[#dce3ef] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-[#e02424]" />
                        <span>{customer.companyName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      {customer.contactPerson ? (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-400" />
                          <span>{customer.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-[#3d4c62] italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#5a657a] whitespace-nowrap">
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-emerald-400" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[#3d4c62] italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      {customer.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-blue-400" />
                          <span className="text-blue-300">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-[#3d4c62] italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] max-w-xs truncate">
                      {customer.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-[#3d4c62] italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#3d4c62]" />
                        <span>{formatDate(customer.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sticky right-0 bg-[#0d1117] group-hover:bg-[#161d2e] transition-colors">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          title="Edit customer"
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(customer)}
                          title="Delete customer"
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {customers.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50 flex items-center justify-between">
            <p className="text-xs text-[#3d4c62] font-medium">
              {customers.length} {customers.length === 1 ? "customer" : "customers"} total
            </p>
          </div>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Customer" : "Add New Customer"} maxWidth="max-w-lg">
        <CustomerForm
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <DeleteCustomerDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        customerName={deleteTarget?.companyName}
      />
    </>
  );
}
