"use client";

// ============================================================
// src/app/(Main)/admin/sub-categories/components/SubCategoryTable.tsx
// Data table for sub-categories with category column, search,
// edit/delete with modals.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Layers } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SubCategoryForm from "./SubCategoryForm";
import DeleteDialog from "./DeleteDialog";
import {
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  type SubCategoryRow,
} from "../actions";
import type { SubCategoryFormValues } from "@/lib/validations/subcategory";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface SubCategoryTableProps {
  subCategories: SubCategoryRow[];
  categories: CategoryOption[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function SubCategoryTable({
  subCategories,
  categories,
}: SubCategoryTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubCategoryRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<SubCategoryRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: SubCategoryRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: SubCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateSubCategory({ ...data, id: editTarget.id })
        : await createSubCategory(data);

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
    const result = await deleteSubCategory(deleteTarget.id);
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
      {/* Add button */}
      <div className="mb-6">
        <button
          id="add-subcategory-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
            bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Sub-Category
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
                  Sub-Category Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#3d4c62] uppercase tracking-wide">
                  Category
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
              {subCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Layers size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No sub-categories found.</p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="text-[#e02424] text-sm font-semibold hover:underline"
                      >
                        Add your first sub-category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                subCategories.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-[#161d2e] transition-colors group"
                  >
                    <td className="px-6 py-4 text-[#3d4c62] font-medium tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#dce3ef]">{sub.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e02424]/10 text-[#e02424]">
                        {sub.category.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden md:table-cell">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[#5a657a] hidden lg:table-cell">
                      {formatDate(sub.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(sub)}
                          title="Edit sub-category"
                          className="p-2 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30
                            transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(sub)}
                          title="Delete sub-category"
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

        {/* Footer */}
        {subCategories.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50">
            <p className="text-xs text-[#3d4c62] font-medium">
              {subCategories.length}{" "}
              {subCategories.length === 1 ? "sub-category" : "sub-categories"} total
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editTarget ? "Edit Sub-Category" : "Add Sub-Category"}
      >
        <SubCategoryForm
          initialData={editTarget}
          categories={categories}
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
        itemName={deleteTarget?.name}
      />
    </>
  );
}
