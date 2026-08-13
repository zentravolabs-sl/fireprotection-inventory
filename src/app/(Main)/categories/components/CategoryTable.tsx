"use client";

// ============================================================
// src/app/(Main)/categories/components/CategoryTable.tsx
// Data table with search, edit, delete and empty/loading states.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import CategoryForm from "./CategoryForm";
import DeleteDialog from "./DeleteDialog";
import Pagination from "@/components/ui/Pagination";
import { createCategory, updateCategory, deleteCategory, type CategoryRow } from "../actions";
import type { CategoryFormValues } from "@/lib/validations/category";

interface CategoryTableProps {
  categories: CategoryRow[];
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

export default function CategoryTable({
  categories,
  total,
  page,
  limit,
  totalPages,
}: CategoryTableProps) {
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: CategoryRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateCategory({ ...data, id: editTarget.id })
        : await createCategory(data);

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
    const result = await deleteCategory(deleteTarget.id);
    if (result.success) {
      toast.success(result.message);
      setDeleteTarget(undefined);
    } else {
      toast.error(result.message);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Action Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Category Directory
          </div>
          <button
            id="add-category-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add Category</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Created</th>
                <th className="px-4 py-3 hidden lg:table-cell">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <FolderOpen size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No categories found.</p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline"
                      >
                        Add your first category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      {cat.categoryName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {formatDate(cat.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        title="Edit category"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        title="Delete category"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editTarget ? "Edit Category" : "Add Category"}
      >
        <CategoryForm
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete confirmation */}
      <DeleteDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.categoryName}
      />
    </>
  );
}
