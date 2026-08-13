"use client";

// ============================================================
// src/app/(Main)/tools/components/ToolTable.tsx
// Data table for Tools module with image thumbnail, preview modal, colored badges, and toast notifications.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Pencil, Trash2, Wrench, Calendar, Hash, Barcode, ZoomIn, Image as ImageIcon, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ToolForm from "./ToolForm";
import DeleteToolDialog from "./DeleteToolDialog";
import Pagination from "@/components/ui/Pagination";
import { createTool, updateTool, deleteTool, type ToolRow } from "../actions";
import type { ToolFormValues } from "@/lib/validations/tool";
import type { ToolCondition, ToolStatus } from "@/generated/prisma/client";

interface ToolTableProps {
  tools: ToolRow[];
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

export default function ToolTable({
  tools,
  total,
  page,
  limit,
  totalPages,
}: ToolTableProps) {
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
        ? await updateTool({ ...data, id: editTarget.id })
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
    const result = await deleteTool(deleteTarget.id);
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
            Tool Directory
          </div>
          <button
            id="add-tool-btn"
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[42px]"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add New Tool</span>
          </button>
        </div>

        {/* Table Card */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 whitespace-nowrap">Tool Code</th>
                <th className="px-4 py-3 w-12 text-center">Image</th>
                <th className="px-4 py-3 whitespace-nowrap">Tool Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Serial Number</th>
                <th className="px-4 py-3 whitespace-nowrap">Condition</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Current Project</th>
                <th className="px-4 py-3 whitespace-nowrap">Engineer</th>
                <th className="px-4 py-3 whitespace-nowrap">Location</th>
                <th className="px-4 py-3 whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {tools.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <Wrench size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No tools match your search or filter criteria.</p>
                      <button type="button" onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">
                        Add a new tool
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                tools.map((tool, idx) => (
                  <tr key={tool.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">{idx + 1}</td>

                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Barcode size={13} className="text-red-600 dark:text-red-400" />
                        <span>{tool.toolCode}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {tool.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: tool.imageUrl!, title: tool.name, code: tool.toolCode })}
                          title="Click to view tool image"
                          className="group/img relative w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-500 overflow-hidden flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40 mx-auto"
                        >
                          <img
                            src={tool.imageUrl}
                            alt={tool.name}
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
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center mx-auto">
                          <ImageIcon size={14} className="text-gray-400" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {tool.name}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Hash size={12} className="text-gray-400" />
                        <span>{tool.serialNo}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getConditionBadge(tool.condition)}`}>
                        {getConditionLabel(tool.condition)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadge(tool.status)}`}>
                        {getStatusLabel(tool.status)}
                      </span>
                    </td>

                    {/* Current Project */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {tool.currentAssignment?.project ? (
                        <div>
                          <div className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{tool.currentAssignment.project.projectCode}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{tool.currentAssignment.project.projectName}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Current Engineer */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {tool.currentAssignment?.engineer ? (
                        <span className="text-gray-800 dark:text-gray-200 font-medium text-xs">{tool.currentAssignment.engineer.name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {tool.currentAssignment?.project ? (
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {tool.currentAssignment.project.location || "Project Site"}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Warehouse</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        <span>{formatDate(tool.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/tools/${tool.id}`}
                        title="View tool details"
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(tool)}
                        title="Edit tool"
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tool)}
                        title="Delete tool"
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center gap-1"
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

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Tool" : "Add New Tool"} maxWidth="max-w-xl">
        <ToolForm
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <DeleteToolDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        toolName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.toolCode})` : undefined}
      />

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
