"use client";

// ============================================================
// src/app/(Main)/customers/components/CustomerTable.tsx
// Data table for Customers module with modal dialogs and toast notifications.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Building, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Modal from "@/components/ui/Modal";
import CustomerForm from "./CustomerForm";
import DeleteCustomerDialog from "./DeleteCustomerDialog";
import Pagination from "@/components/ui/Pagination";
import { createCustomer, updateCustomer, deleteCustomer, type CustomerRow } from "../actions";
import type { CustomerFormValues } from "@/lib/validations/customer";

interface CustomerTableProps {
  customers?: CustomerRow[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  isLoading?: boolean;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

import CustomerTableSkeleton from "./CustomerTableSkeleton";

export { CustomerTableSkeleton };

export default function CustomerTable({
  customers = [],
  total = 0,
  page = 1,
  limit = 5,
  totalPages = 1,
  isLoading = false,
}: CustomerTableProps) {
  if (isLoading) {
    return <CustomerTableSkeleton />;
  }
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Customer Directory
          </div>
          <button
            id="add-customer-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Company Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Contact Person</th>
                <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 whitespace-nowrap">Address</th>
                <th className="px-4 py-3 whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Building size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No customers match your search criteria.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">
                        Add a new customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, idx) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-red-600 dark:text-red-400" />
                        <span>{customer.companyName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {customer.contactPerson ? (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-400" />
                          <span>{customer.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-emerald-500" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {customer.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {customer.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        <span>{formatDate(customer.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(customer)}
                        title="Edit customer"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(customer)}
                        title="Delete customer"
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
