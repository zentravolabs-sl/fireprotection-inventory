"use client";

// ============================================================
// src/app/(Main)/admin/tools/components/DeleteToolDialog.tsx
// Confirmation modal dialog for deleting a tool.
// ============================================================

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface DeleteToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  toolName?: string;
}

export default function DeleteToolDialog({
  isOpen,
  onClose,
  onConfirm,
  toolName,
}: DeleteToolDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Tool" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 space-y-1">
            <p className="font-bold text-sm text-red-700">Are you sure?</p>
            <p>
              This will permanently delete{" "}
              {toolName ? <span className="font-bold">&ldquo;{toolName}&rdquo;</span> : "this tool"}{" "}
              from the system. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete Tool
          </button>
        </div>
      </div>
    </Modal>
  );
}
