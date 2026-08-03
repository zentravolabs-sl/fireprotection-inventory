"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/InventoryTable.tsx
// Professional ERP Inventory Table with Add Item, Export, Print,
// Modal Forms, Delete Confirmation, and Status Badges.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Package, Download, Printer, Plus, AlertCircle, Image as ImageIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import InventoryForm from "./InventoryForm";
import { createInventory, updateInventory, deleteInventory, type InventoryRow } from "../actions";
import type { InventoryFormValues } from "@/lib/validations/inventory";

interface CategoryOption {
  id: number;
  categoryName: string;
}

interface InventoryTableProps {
  inventories: InventoryRow[];
  categories: CategoryOption[];
}

export default function InventoryTable({ inventories, categories }: InventoryTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (row: InventoryRow) => {
    setEditTarget(row);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleFormSubmit = async (data: InventoryFormValues) => {
    setIsSubmitting(true);
    try {
      const result = editTarget
        ? await updateInventory({ ...data, id: editTarget.id })
        : await createInventory(data);

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
    setIsDeleting(true);
    try {
      const result = await deleteInventory(deleteTarget.id);
      if (result.success) {
        toast.success(result.message);
        setDeleteTarget(undefined);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (inventories.length === 0) {
      toast.info("No data to export.");
      return;
    }
    const headers = [
      "Item Code",
      "Item Name",
      "Category",
      "Sub Category",
      "Brand",
      "Unit",
      "Current Stock",
      "Min Stock",
      "Rack",
      "Warehouse",
      "Default Sell Price",
      "Barcode",
    ];
    const rows = inventories.map((i) => [
      `"${i.itemCode}"`,
      `"${i.name}"`,
      `"${i.category.categoryName}"`,
      `"${i.subCategory.name}"`,
      `"${i.brand || ""}"`,
      `"${i.unit}"`,
      i.currentStock,
      i.minStock,
      `"${i.rackLocation || ""}"`,
      `"${i.warehouse || ""}"`,
      i.defaultSellPrice,
      `"${i.barcode || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory exported to CSV successfully.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#dce3ef] bg-[#161d2e] hover:bg-[#1e2a3d] border border-[#1e2a3d] rounded-xl transition-colors"
          >
            <Download size={14} className="text-[#e02424]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#dce3ef] bg-[#161d2e] hover:bg-[#1e2a3d] border border-[#1e2a3d] rounded-xl transition-colors"
          >
            <Printer size={14} className="text-[#e02424]" />
            Print List
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Item Code</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Image</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Item Name</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Category</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Sub Category</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Brand</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Unit</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Current Stock</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Min Stock</th>
                <th className="px-4 py-3.5 text-center font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Package size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No inventory items found.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-xs font-semibold hover:underline">
                        Create your first inventory master item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inventories.map((item, idx) => {
                  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
                  if (item.currentStock === 0) stockStatus = "OUT_OF_STOCK";
                  else if (item.currentStock <= item.minStock) stockStatus = "LOW_STOCK";

                  return (
                    <tr key={item.id} className="hover:bg-[#161d2e] transition-colors group">
                      <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-[#e02424] tabular-nums whitespace-nowrap">{item.itemCode}</td>
                      <td className="px-4 py-3 text-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded-lg border border-[#1e2a3d] mx-auto"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#161d2e] border border-[#1e2a3d] flex items-center justify-center mx-auto text-[#3d4c62]">
                            <ImageIcon size={14} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#dce3ef] max-w-xs truncate">{item.name}</td>
                      <td className="px-4 py-3 text-[#dce3ef]">{item.category.categoryName}</td>
                      <td className="px-4 py-3 text-[#5a657a]">{item.subCategory.name}</td>
                      <td className="px-4 py-3 text-[#5a657a]">{item.brand || "—"}</td>
                      <td className="px-4 py-3 text-center text-[#dce3ef] font-medium">{item.unit}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#dce3ef] tabular-nums">{item.currentStock}</td>
                      <td className="px-4 py-3 text-right text-[#5a657a] tabular-nums">{item.minStock}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={stockStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {inventories.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50 flex items-center justify-between">
            <p className="text-xs text-[#3d4c62] font-medium">
              Showing {inventories.length} item{inventories.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Inventory Item" : "Add Inventory Item"}>
        <InventoryForm
          initialData={editTarget}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.itemCode})? This action cannot be undone.`}
        confirmText="Delete Item"
        isLoading={isDeleting}
      />
    </>
  );
}
