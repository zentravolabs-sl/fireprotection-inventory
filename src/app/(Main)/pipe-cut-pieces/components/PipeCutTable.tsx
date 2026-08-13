"use client";

// ============================================================
// src/app/(Main)/pipe-cut-pieces/components/PipeCutTable.tsx
// Pipe Cut Pieces Table with Add, Edit, and Delete actions.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, Scissors } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PipeCutForm from "./PipeCutForm";
import Pagination from "@/components/ui/Pagination";
import { createPipeCutPiece, updatePipeCutPiece, deletePipeCutPiece, type PipeCutPieceRow } from "../actions";
import type { PipeCutPieceFormValues } from "@/lib/validations/pipe-cut-piece";

interface InventoryOption {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
}

interface PipeCutTableProps {
  cutPieces: PipeCutPieceRow[];
  inventoryItems: InventoryOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PipeCutTable({
  cutPieces,
  inventoryItems,
  total,
  page,
  limit,
  totalPages,
}: PipeCutTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PipeCutPieceRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<PipeCutPieceRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: PipeCutPieceRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: PipeCutPieceFormValues) => {
    setIsSubmitting(true);
    try {
      const res = editTarget
        ? await updatePipeCutPiece({ ...data, id: editTarget.id })
        : await createPipeCutPiece(data);

      if (res.success) {
        toast.success(res.message);
        closeForm();
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deletePipeCutPiece(deleteTarget.id);
      if (res.success) {
        toast.success(res.message);
        setDeleteTarget(undefined);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        {/* Controls / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Pipe Off-Cut Inventory
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <Plus size={16} />
            <span>Add Cut Piece</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Pipe Item</th>
                <th className="px-4 py-3 whitespace-nowrap">Source Batch</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Original Length</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Remaining Length</th>
                <th className="px-4 py-3 whitespace-nowrap">Rack</th>
                <th className="px-4 py-3 whitespace-nowrap">Barcode</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {cutPieces.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Scissors size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No pipe cut off-cuts recorded.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-xs font-semibold hover:underline">
                        Record your first pipe off-cut
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                cutPieces.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                      [{row.inventory.itemCode}] {row.inventory.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {row.stockBatch.batchNo || `BATCH-#${row.stockBatchId}`}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                      {row.parentLength} {row.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {row.pieceLength} {row.unit}
                    </td>
                    <td className="px-4 py-3.5 text-gray-800 dark:text-gray-200">{row.rackLocation || "—"}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{row.barcode || "—"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1"
                        title="Edit Cut Piece"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1"
                        title="Delete Cut Piece"
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

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Cut Piece" : "Add Cut Piece"}>
        <PipeCutForm
          initialData={editTarget}
          inventoryItems={inventoryItems}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        title="Delete Pipe Cut Piece"
        description={`Are you sure you want to delete this cut piece record (${deleteTarget?.pieceLength} ${deleteTarget?.unit})?`}
        confirmText="Delete Cut Piece"
        isLoading={isDeleting}
      />
    </>
  );
}
