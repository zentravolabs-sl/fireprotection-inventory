"use client";

// ============================================================
// src/app/(Main)/tools/components/DeleteToolDialog.tsx
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-36 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete Tool
          </button>
        </div>
      </div>
    </Modal>
  );
}
