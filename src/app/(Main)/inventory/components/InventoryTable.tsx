"use client";

// ============================================================
// src/app/(Main)/inventory/components/InventoryTable.tsx
// Professional ERP Inventory Table with Add Item, Export, Print,
// Modal Forms, Delete Confirmation, and Status Badges.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Package, Plus, AlertCircle, Image as ImageIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import InventoryForm from "./InventoryForm";
import Pagination from "@/components/ui/Pagination";
import { createInventory, updateInventory, deleteInventory, type InventoryRow } from "../actions";
import type { InventoryFormValues } from "@/lib/validations/inventory";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface InventoryTableProps {
  inventories: InventoryRow[];
  categories: CategoryOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function InventoryTable({
  inventories,
  categories,
  total,
  page,
  limit,
  totalPages,
}: InventoryTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: InventoryRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: InventoryFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateInventory({ ...data, id: editTarget.id })
        : await createInventory(data);

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
    setIsDeleting(true);
    try {
      const result = await deleteInventory(deleteTarget.id);
      if (result.success) {
        toast.success(result.message);
        setDeleteTarget(undefined);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Action Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Inventory Directory
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[38px]"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3 text-center">Image</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sub Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3 text-center">Unit</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-right">Min Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No inventory items found.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-xs font-semibold hover:underline">
                        Create your first inventory master item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inventories.map((item, idx) => {
                  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
                  if (item.currentStock === 0) stockStatus = "OUT_OF_STOCK";
                  else if (item.currentStock <= item.minStock) stockStatus = "LOW_STOCK";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{item.itemCode}</td>
                      <td className="px-4 py-3.5 text-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded-lg border border-gray-200 dark:border-gray-700 mx-auto"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto text-gray-400">
                            <ImageIcon size={14} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{item.name}</td>
                      <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200">{item.category.categoryName}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{item.subCategory.name}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{item.brand || "—"}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-gray-800 dark:text-gray-200">{item.unit}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">{item.currentStock}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400 tabular-nums">{item.minStock}</td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={stockStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            title="Edit Item"
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Item"
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editTarget ? "Edit Inventory Item" : "Add Inventory Item"}
        maxWidth="max-w-3xl"
      >
        <InventoryForm
          initialData={editTarget}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.itemCode})? This action cannot be undone.`}
        confirmText="Delete Item"
        isLoading={isDeleting}
      />
    </>
  );
}
