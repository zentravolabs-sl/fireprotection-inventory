"use client";

// ============================================================
// src/app/(Main)/admin/pipe-cut-pieces/components/PipeCutForm.tsx
// React Form for Pipe Cut Piece creation and editing.
// ============================================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { pipeCutPieceSchema, type PipeCutPieceFormValues } from "@/lib/validations/pipe-cut-piece";
import { getStockBatchesByInventoryId } from "@/app/(Main)/admin/stock-batch/actions";
import type { PipeCutPieceRow } from "../actions";

interface InventoryOption {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
}

interface PipeCutFormProps {
  initialData?: PipeCutPieceRow;
  inventoryItems: InventoryOption[];
  onSubmit: (data: PipeCutPieceFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function PipeCutForm({
  initialData,
  inventoryItems,
  onSubmit,
  onCancel,
  isSubmitting,
}: PipeCutFormProps) {
  const isEdit = Boolean(initialData);
  const [batches, setBatches] = useState<{ id: number; batchNo: string | null; availableQty: number }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(pipeCutPieceSchema),
    defaultValues: {
      inventoryId: initialData?.inventoryId ?? 0,
      stockBatchId: initialData?.stockBatchId ?? 0,
      parentLength: initialData?.parentLength ?? 6,
      pieceLength: initialData?.pieceLength ?? 3,
      unit: initialData?.unit ?? "Mtr",
      barcode: initialData?.barcode ?? "",
      rackLocation: initialData?.rackLocation ?? "",
      status: initialData?.status ?? "AVAILABLE",
      remarks: initialData?.remarks ?? "",
    },
  });

  const selectedInventoryId = watch("inventoryId");

  useEffect(() => {
    if (!selectedInventoryId) {
      setBatches([]);
      return;
    }
    let isMounted = true;
    getStockBatchesByInventoryId(Number(selectedInventoryId)).then((res) => {
      if (isMounted) {
        setBatches(res.map((b) => ({ id: b.id, batchNo: b.batchNo, availableQty: b.availableQty })));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedInventoryId]);

  useEffect(() => {
    if (initialData) {
      reset({
        inventoryId: initialData.inventoryId,
        stockBatchId: initialData.stockBatchId,
        parentLength: initialData.parentLength,
        pieceLength: initialData.pieceLength,
        unit: initialData.unit,
        barcode: initialData.barcode ?? "",
        rackLocation: initialData.rackLocation ?? "",
        status: initialData.status,
        remarks: initialData.remarks ?? "",
      });
    }
  }, [initialData, reset]);

  const inputClass = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-400 text-gray-900 bg-white
    disabled:opacity-60 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Pipe & Batch Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Pipe Item Master <span className="text-red-500">*</span>
          </label>
          <select
            {...register("inventoryId")}
            onChange={(e) => {
              setValue("inventoryId", Number(e.target.value));
              setValue("stockBatchId", 0);
            }}
            disabled={isSubmitting}
            className={inputClass(!!errors.inventoryId)}
          >
            <option value={0}>Select Pipe Item</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.itemCode}] {item.name}
              </option>
            ))}
          </select>
          {errors.inventoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.inventoryId.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Source Batch <span className="text-red-500">*</span>
          </label>
          <select
            {...register("stockBatchId")}
            disabled={isSubmitting || !selectedInventoryId}
            className={inputClass(!!errors.stockBatchId)}
          >
            <option value={0}>Select Source Batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNo || `BATCH-#${b.id}`} (Avail: {b.availableQty})
              </option>
            ))}
          </select>
          {errors.stockBatchId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.stockBatchId.message}</p>}
        </div>
      </div>

      {/* Lengths & Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Parent Length <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            {...register("parentLength")}
            placeholder="e.g. 6.0"
            disabled={isSubmitting}
            className={inputClass(!!errors.parentLength)}
          />
          {errors.parentLength && <p className="mt-1 text-xs text-red-600 font-medium">{errors.parentLength.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Cut Piece Length <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            {...register("pieceLength")}
            placeholder="e.g. 2.4"
            disabled={isSubmitting}
            className={inputClass(!!errors.pieceLength)}
          />
          {errors.pieceLength && <p className="mt-1 text-xs text-red-600 font-medium">{errors.pieceLength.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("unit")}
            placeholder="e.g. Mtr / Ft"
            disabled={isSubmitting}
            className={inputClass(!!errors.unit)}
          />
          {errors.unit && <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit.message}</p>}
        </div>
      </div>

      {/* Barcode, Rack, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Barcode</label>
          <input
            type="text"
            {...register("barcode")}
            placeholder="e.g. CUT-90123"
            disabled={isSubmitting}
            className={inputClass(!!errors.barcode)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Rack Location</label>
          <input
            type="text"
            {...register("rackLocation")}
            placeholder="e.g. Offcut Rack B"
            disabled={isSubmitting}
            className={inputClass(!!errors.rackLocation)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select {...register("status")} disabled={isSubmitting} className={inputClass(!!errors.status)}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="USED">USED</option>
            <option value="SCRAPPED">SCRAPPED</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
        <input
          type="text"
          {...register("remarks")}
          placeholder="e.g. Offcut from Sprinkler Line 4 cut"
          disabled={isSubmitting}
          className={inputClass(!!errors.remarks)}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Cut Piece" : "Save Cut Piece"}
        </button>
      </div>
    </form>
  );
}
