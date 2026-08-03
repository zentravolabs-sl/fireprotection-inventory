"use client";

// ============================================================
// src/app/(Main)/admin/pipe-cut-pieces/components/PipeCutTable.tsx
// Pipe Cut Pieces Table with Add, Edit, and Delete actions.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, Scissors } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PipeCutForm from "./PipeCutForm";
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
}

export default function PipeCutTable({ cutPieces, inventoryItems }: PipeCutTableProps) {
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Add Cut Piece
        </button>
      </div>

      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Pipe Item</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Source Batch</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Original Length</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Remaining Length</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Rack</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Barcode</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {cutPieces.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Scissors size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No pipe cut off-cuts recorded.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-xs font-semibold hover:underline">
                        Record your first pipe off-cut
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                cutPieces.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-[#161d2e] transition-colors group">
                    <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#dce3ef]">
                      [{row.inventory.itemCode}] {row.inventory.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#e02424] font-semibold">
                      {row.stockBatch.batchNo || `BATCH-#${row.stockBatchId}`}
                    </td>
                    <td className="px-4 py-3 text-right text-[#5a657a] tabular-nums">
                      {row.parentLength} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#dce3ef] tabular-nums">
                      {row.pieceLength} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-[#dce3ef]">{row.rackLocation || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[#5a657a]">{row.barcode || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Cut Piece"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Cut Piece"
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
