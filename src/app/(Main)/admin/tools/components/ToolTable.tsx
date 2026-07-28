"use client";

// ============================================================
// src/app/(Main)/admin/tools/components/ToolTable.tsx
// Data table for Tools module with image thumbnail, preview modal, colored badges, and toast notifications.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Wrench, Calendar, Hash, Barcode, ZoomIn, Image as ImageIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ToolForm from "./ToolForm";
import DeleteToolDialog from "./DeleteToolDialog";
import { createTool, updateTool, deleteTool, type ToolRow } from "../actions";
import type { ToolFormValues } from "@/lib/validations/tool";
import type { ToolCondition, ToolStatus } from "@/generated/prisma/client";

interface ToolTableProps {
  tools: ToolRow[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getConditionBadge(condition: ToolCondition) {
  switch (condition) {
    case "New":
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "Good":
      return "bg-blue-950/60 text-blue-400 border-blue-800/60";
    case "Fair":
      return "bg-amber-950/60 text-amber-300 border-amber-800/60";
    case "Damaged":
      return "bg-red-950/60 text-red-400 border-red-800/60";
    case "UnderRepair":
      return "bg-orange-950/60 text-orange-400 border-orange-800/60";
    default:
      return "bg-gray-900/60 text-gray-400 border-gray-700/60";
  }
}

function getConditionLabel(condition: ToolCondition) {
  if (condition === "UnderRepair") return "Under Repair";
  return condition;
}

function getStatusBadge(status: ToolStatus) {
  switch (status) {
    case "Available":
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "InUse":
      return "bg-blue-950/60 text-blue-400 border-blue-800/60";
    case "Maintenance":
      return "bg-orange-950/60 text-orange-400 border-orange-800/60";
    case "Lost":
      return "bg-red-950/60 text-red-400 border-red-800/60";
    case "Retired":
      return "bg-gray-900/60 text-gray-400 border-gray-700/60";
    default:
      return "bg-gray-900/60 text-gray-400 border-gray-700/60";
  }
}

function getStatusLabel(status: ToolStatus) {
  if (status === "InUse") return "In Use";
  return status;
}

export default function ToolTable({ tools }: ToolTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ToolRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ToolRow | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; code: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: ToolRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: ToolFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateTool({ ...data, Id: editTarget.Id })
        : await createTool(data);

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
    const result = await deleteTool(deleteTarget.Id);
    if (result.success) {
      toast.success(result.message);
      setDeleteTarget(undefined);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      {/* Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          id="add-tool-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add New Tool
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-10">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Tool Code</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-12">Image</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Tool Name</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Serial Number</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Condition</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap sticky right-0 bg-[#080c12]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {tools.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Wrench size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No tools match your search or filter criteria.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">
                        Add a new tool
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                tools.map((tool, idx) => (
                  <tr key={tool.Id} className="hover:bg-[#161d2e] transition-colors group">
                    {/* # */}
                    <td className="px-4 py-3.5 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>

                    {/* Tool Code */}
                    <td className="px-4 py-3.5 font-mono font-bold text-[#e02424] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Barcode size={13} className="text-[#e02424]" />
                        <span>{tool.ToolCode}</span>
                      </div>
                    </td>

                    {/* Image Thumbnail with Click-to-Preview */}
                    <td className="px-4 py-3.5">
                      {tool.image_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: tool.image_url!, title: tool.Name, code: tool.ToolCode })}
                          title="Click to view tool image"
                          className="group/img relative w-9 h-9 rounded-lg bg-[#161d2e] border border-[#1e2a3d] hover:border-red-500 overflow-hidden flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        >
                          <img
                            src={tool.image_url}
                            alt={tool.Name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/50x50?text=NA";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn size={14} className="text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#161d2e] border border-[#1e2a3d] overflow-hidden flex items-center justify-center">
                          <ImageIcon size={14} className="text-[#3d4c62]" />
                        </div>
                      )}
                    </td>

                    {/* Tool Name */}
                    <td className="px-4 py-3.5 font-semibold text-[#dce3ef] max-w-xs truncate">
                      {tool.Name}
                    </td>

                    {/* Serial Number */}
                    <td className="px-4 py-3.5 font-mono text-[#5a657a] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Hash size={12} className="text-[#3d4c62]" />
                        <span>{tool.SerialNo}</span>
                      </div>
                    </td>

                    {/* Condition Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getConditionBadge(tool.Condition)}`}>
                        {getConditionLabel(tool.Condition)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadge(tool.Status)}`}>
                        {getStatusLabel(tool.Status)}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-[#5a657a] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#3d4c62]" />
                        <span>{formatDate(tool.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions Sticky Column */}
                    <td className="px-4 py-3.5 sticky right-0 bg-[#0d1117] group-hover:bg-[#161d2e] transition-colors">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(tool)}
                          title="Edit tool"
                          className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(tool)}
                          title="Delete tool"
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

        {/* Footer */}
        {tools.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50 flex items-center justify-between">
            <p className="text-xs text-[#3d4c62] font-medium">
              {tools.length} {tools.length === 1 ? "tool" : "tools"} total
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Tool" : "Add New Tool"} maxWidth="max-w-xl">
        <ToolForm
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Modal */}
      <DeleteToolDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        toolName={deleteTarget ? `${deleteTarget.Name} (${deleteTarget.ToolCode})` : undefined}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={`Tool Image Preview — ${previewImage.code}`}
          maxWidth="max-w-xl"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-h-[70vh] rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-base">{previewImage.title}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Code: {previewImage.code}</p>
            </div>
            <div className="flex justify-end w-full pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
