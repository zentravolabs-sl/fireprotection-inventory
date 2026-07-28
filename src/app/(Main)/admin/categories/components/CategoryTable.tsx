"use client";

// ============================================================
// src/app/(Main)/admin/categories/components/CategoryTable.tsx
// Data table with search, edit, delete and empty/loading states.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import CategoryForm from "./CategoryForm";
import DeleteDialog from "./DeleteDialog";
import { createCategory, updateCategory, deleteCategory, type CategoryRow } from "../actions";
import type { CategoryFormValues } from "@/lib/validations/category";

interface CategoryTableProps {
  categories: CategoryRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function CategoryTable({ categories }: CategoryTableProps) {
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
      {/* Add button — exposed to parent page via prop pattern */}
      <div className="mb-6">
        <button
          id="add-category-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
            bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Category
        </button>
      </div>

      {/* Table card */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide w-12">
                  #
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide">
                  Category Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide hidden md:table-cell">
                  Created
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide hidden lg:table-cell">
                  Updated
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#3d4c62] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <FolderOpen size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No categories found.</p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="text-[#e02424] text-sm font-semibold hover:underline"
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
                    className="hover:bg-[#161d2e] transition-colors group"
                  >
                    <td className="px-6 py-4 text-[#3d4c62] font-medium tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#dce3ef]">{cat.categoryName}</span>
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden md:table-cell">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden lg:table-cell">
                      {formatDate(cat.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          title="Edit category"
                          className="p-2 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30
                            transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          title="Delete category"
                          className="p-2 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10
                            transition-colors opacity-0 group-hover:opacity-100"
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

        {/* Row count footer */}
        {categories.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50">
            <p className="text-xs text-[#3d4c62] font-medium">
              {categories.length} {categories.length === 1 ? "category" : "categories"} total
            </p>
          </div>
        )}
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
