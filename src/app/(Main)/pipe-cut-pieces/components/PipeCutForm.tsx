"use client";

// ============================================================
// src/app/(Main)/pipe-cut-pieces/components/PipeCutForm.tsx
// React Form for Pipe Cut Piece creation and editing.
// ============================================================

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { Loader2 } from "lucide-react";
import { pipeCutPieceSchema, type PipeCutPieceFormValues } from "@/lib/validations/pipe-cut-piece";
import { getStockBatchesByInventoryId } from "@/app/(Main)/stock-batch/actions";
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
    control,
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
    `w-full px-4 py-3 text-sm border rounded-xl outline-none transition-all duration-200
    placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
    disabled:opacity-60 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
        : "border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Pipe & Batch Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Pipe Item Master *
          </label>
          <Controller
            control={control}
            name="inventoryId"
            render={({ field }) => (
              <Select
                instanceId="pipecut-inventory-select"
                options={inventoryItems.map((item) => ({
                  value: item.id,
                  label: `[${item.itemCode}] ${item.name}`,
                }))}
                value={
                  inventoryItems
                    .filter((item) => item.id === field.value)
                    .map((item) => ({
                      value: item.id,
                      label: `[${item.itemCode}] ${item.name}`,
                    }))[0] || null
                }
                onChange={(val) => {
                  field.onChange(val ? val.value : 0);
                  setValue("stockBatchId", 0);
                }}
                placeholder="Select Pipe Item"
                isSearchable
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                styles={getCustomSelectStyles(!!errors.inventoryId)}
              />
            )}
          />
          {errors.inventoryId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.inventoryId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Source Batch *
          </label>
          <Controller
            control={control}
            name="stockBatchId"
            render={({ field }) => (
              <Select
                instanceId="pipecut-batch-select"
                options={batches.map((b) => ({
                  value: b.id,
                  label: `${b.batchNo || `BATCH-#${b.id}`} (Avail: ${b.availableQty})`,
                }))}
                value={
                  batches
                    .filter((b) => b.id === field.value)
                    .map((b) => ({
                      value: b.id,
                      label: `${b.batchNo || `BATCH-#${b.id}`} (Avail: ${b.availableQty})`,
                    }))[0] || null
                }
                onChange={(val) => field.onChange(val ? val.value : 0)}
                placeholder="Select Source Batch"
                isDisabled={isSubmitting || !selectedInventoryId}
                isSearchable
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                styles={getCustomSelectStyles(!!errors.stockBatchId)}
              />
            )}
          />
          {errors.stockBatchId && <p className="mt-1 text-xs text-red-600 font-medium">{errors.stockBatchId.message}</p>}
        </div>
      </div>

      {/* Lengths & Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Parent Length *
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Cut Piece Length *
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Unit *
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Barcode</label>
          <input
            type="text"
            {...register("barcode")}
            placeholder="e.g. CUT-90123"
            disabled={isSubmitting}
            className={inputClass(!!errors.barcode)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rack Location</label>
          <input
            type="text"
            {...register("rackLocation")}
            placeholder="e.g. Offcut Rack B"
            disabled={isSubmitting}
            className={inputClass(!!errors.rackLocation)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                instanceId="pipecut-status-select"
                options={[
                  { value: "AVAILABLE", label: "AVAILABLE" },
                  { value: "USED", label: "USED" },
                  { value: "SCRAPPED", label: "SCRAPPED" },
                ]}
                value={field.value ? { value: field.value, label: field.value } : null}
                onChange={(val) => val && field.onChange(val.value)}
                isSearchable={false}
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                styles={getCustomSelectStyles(!!errors.status)}
              />
            )}
          />
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Remarks</label>
        <input
          type="text"
          {...register("remarks")}
          placeholder="e.g. Offcut from Sprinkler Line 4 cut"
          disabled={isSubmitting}
          className={inputClass(!!errors.remarks)}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-32 py-3 px-5 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 text-center disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-44 py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg shadow-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Cut Piece" : "Save Cut Piece"}
        </button>
      </div>
    </form>
  );
}
