"use client";

// ============================================================
// src/app/(Main)/admin/sub-categories/components/DeleteDialog.tsx
// Reusable delete confirmation modal for sub-categories.
// ============================================================

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName?: string;
}

export default function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        <div>
          <p className="text-gray-800 font-semibold text-base">
            Are you sure you want to delete this record?
          </p>
          {itemName && (
            <p className="text-gray-500 text-sm mt-1">
              <span className="font-medium text-gray-700">&ldquo;{itemName}&rdquo;</span> will be
              permanently removed.
            </p>
          )}
          <p className="text-gray-400 text-xs mt-2">This action cannot be undone.</p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100
              hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm
              font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors
              shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
