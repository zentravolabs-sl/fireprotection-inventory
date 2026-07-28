"use client";

// ============================================================
// src/app/(Main)/admin/inventory/components/InventoryTable.tsx
// Data table with 19 columns, stock/expiry status badges, image click preview modal, and toast notifications.
// ============================================================

import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Package, Building2, Barcode, Image as ImageIcon, Calendar, Tag, Layers, MapPin, ZoomIn } from "lucide-react";
import Modal from "@/components/ui/Modal";
import InventoryForm from "./InventoryForm";
import DeleteInventoryDialog from "./DeleteInventoryDialog";
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

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function InventoryTable({ inventories, categories }: InventoryTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryRow | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; code: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

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
        ? await updateInventory({ ...data, Id: editTarget.Id })
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
    const result = await deleteInventory(deleteTarget.Id);
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
          id="add-inventory-item-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Inventory Item
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-10">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Item Code</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide w-12">Image</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Name</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Category</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Sub Category</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Brand</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Unit</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Current Stock</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Minimum Stock</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Buy Price</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Sell Price</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Supplier</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Warehouse</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Rack Location</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Issue Location</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Expiry Date</th>
                <th className="px-4 py-3.5 text-left font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap">Barcode</th>
                <th className="px-4 py-3.5 text-right font-semibold text-[#3d4c62] uppercase tracking-wide whitespace-nowrap sticky right-0 bg-[#080c12]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={19} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#161d2e] flex items-center justify-center">
                        <Package size={24} className="text-[#3d4c62]" />
                      </div>
                      <p className="text-[#5a657a] font-medium text-sm">No inventory items match your filter criteria.</p>
                      <button type="button" onClick={openCreate} className="text-[#e02424] text-sm font-semibold hover:underline">
                        Add a new inventory item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                inventories.map((item, idx) => {
                  // Badges Calculations
                  const isOutOfStock = item.Qty === 0;
                  const isLowStock = !isOutOfStock && item.Qty <= item.MinStock;

                  let isExpired = false;
                  let isExpiringSoon = false;
                  if (item.ExpiryDate) {
                    const exp = new Date(item.ExpiryDate);
                    exp.setHours(0, 0, 0, 0);
                    if (exp < today) isExpired = true;
                    else if (exp <= thirtyDaysFromNow) isExpiringSoon = true;
                  }

                  return (
                    <tr key={item.Id} className="hover:bg-[#161d2e] transition-colors group">
                      {/* # */}
                      <td className="px-4 py-3 text-[#3d4c62] font-medium tabular-nums">{idx + 1}</td>

                      {/* Item Code */}
                      <td className="px-4 py-3 font-mono font-bold text-[#e02424] whitespace-nowrap">
                        {item.ItemCode}
                      </td>

                      {/* Image Thumbnail with Click-to-Preview */}
                      <td className="px-4 py-3">
                        {item.image_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: item.image_url!, title: item.Name, code: item.ItemCode })}
                            title="Click to view image"
                            className="group/img relative w-9 h-9 rounded-lg bg-[#161d2e] border border-[#1e2a3d] hover:border-red-500 overflow-hidden flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          >
                            <img
                              src={item.image_url}
                              alt={item.Name}
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

                      {/* Name */}
                      <td className="px-4 py-3 font-semibold text-[#dce3ef] max-w-xs truncate">
                        {item.Name}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Tag size={12} className="text-[#e02424]" />
                          <span>{item.category?.categoryName}</span>
                        </div>
                      </td>

                      {/* Sub Category */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Layers size={12} className="text-orange-400" />
                          <span>{item.subCategory?.name}</span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">
                        {item.Brand || <span className="text-[#3d4c62] italic">—</span>}
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap font-medium">{item.Unit}</td>

                      {/* Current Stock + Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#dce3ef] tabular-nums">{item.Qty}</span>
                          {isOutOfStock && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-400 bg-red-950/60 rounded border border-red-800/60">
                              Out of Stock
                            </span>
                          )}
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 rounded border border-amber-800/60">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Minimum Stock */}
                      <td className="px-4 py-3 text-[#5a657a] tabular-nums whitespace-nowrap">{item.MinStock}</td>

                      {/* Buy Price */}
                      <td className="px-4 py-3 text-[#5a657a] tabular-nums whitespace-nowrap">${item.BuyPrice.toFixed(2)}</td>

                      {/* Sell Price */}
                      <td className="px-4 py-3 text-emerald-400 font-semibold tabular-nums whitespace-nowrap">${item.SellPrice.toFixed(2)}</td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-[#dce3ef] whitespace-nowrap">
                        {item.supplier ? (
                          <div className="flex items-center gap-1">
                            <Building2 size={12} className="text-blue-400" />
                            <span className="text-blue-300 font-medium">{item.supplier.Company}</span>
                          </div>
                        ) : (
                          <span className="text-[#3d4c62] italic">—</span>
                        )}
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">
                        {item.Warehouse || <span className="text-[#3d4c62] italic">—</span>}
                      </td>

                      {/* Rack Location */}
                      <td className="px-4 py-3 text-[#5a657a] whitespace-nowrap">
                        {item.RackLocation ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span>{item.RackLocation}</span>
                          </div>
                        ) : (
                          <span className="text-[#3d4c62] italic">—</span>
                        )}
                      </td>

                      {/* Issue Location */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                          item.issueLocation === "Warehouse"
                            ? "bg-blue-950/50 text-blue-300 border border-blue-800/50"
                            : "bg-purple-950/50 text-purple-300 border border-purple-800/50"
                        }`}>
                          {item.issueLocation}
                        </span>
                      </td>

                      {/* Expiry Date + Badges */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.ExpiryDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#5a657a]" />
                            <span className="text-[#5a657a]">{formatDate(item.ExpiryDate)}</span>
                            {isExpired && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-400 bg-red-950/60 rounded border border-red-800/60">
                                Expired
                              </span>
                            )}
                            {isExpiringSoon && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold text-purple-300 bg-purple-950/60 rounded border border-purple-800/60">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#3d4c62] italic">—</span>
                        )}
                      </td>

                      {/* Barcode */}
                      <td className="px-4 py-3 font-mono text-[#5a657a] whitespace-nowrap">
                        {item.Barcode ? (
                          <div className="flex items-center gap-1">
                            <Barcode size={12} className="text-[#3d4c62]" />
                            <span>{item.Barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[#3d4c62] italic">—</span>
                        )}
                      </td>

                      {/* Actions Sticky Column */}
                      <td className="px-4 py-3 sticky right-0 bg-[#0d1117] group-hover:bg-[#161d2e] transition-colors">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            title="Edit inventory item"
                            className="p-1.5 rounded-lg text-[#5a657a] hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete inventory item"
                            className="p-1.5 rounded-lg text-[#5a657a] hover:text-[#e02424] hover:bg-[#e02424]/10 transition-colors"
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

        {/* Footer */}
        {inventories.length > 0 && (
          <div className="px-6 py-3 border-t border-[#1e2a3d] bg-[#080c12]/50 flex items-center justify-between">
            <p className="text-xs text-[#3d4c62] font-medium">
              {inventories.length} {inventories.length === 1 ? "item" : "items"} total
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editTarget ? "Edit Inventory Item" : "Add Inventory Item"} maxWidth="max-w-3xl">
        <InventoryForm
          categories={categories}
          initialData={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Modal */}
      <DeleteInventoryDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDelete}
        itemName={deleteTarget ? `${deleteTarget.Name} (${deleteTarget.ItemCode})` : undefined}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={`Image Preview — ${previewImage.code}`}
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
