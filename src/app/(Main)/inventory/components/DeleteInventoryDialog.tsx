"use client";

// ============================================================
// src/app/(Main)/inventory/components/DeleteInventoryDialog.tsx
// Delete confirmation modal for inventory items.
// ============================================================

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface DeleteInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName?: string;
}

export default function DeleteInventoryDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: DeleteInventoryDialogProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Item Deletion" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        <div>
          <p className="text-gray-800 font-semibold text-base">
            Are you sure you want to delete this inventory item?
          </p>
          {itemName && (
            <p className="text-gray-500 text-sm mt-1">
              <span className="font-medium text-gray-700">&ldquo;{itemName}&rdquo;</span> will be
              permanently removed.
            </p>
          )}
          <p className="text-gray-400 text-xs mt-2">This action cannot be undone.</p>
        </div>

        <div className="flex items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete Item"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
