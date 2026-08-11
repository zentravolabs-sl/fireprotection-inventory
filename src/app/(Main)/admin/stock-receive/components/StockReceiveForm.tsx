"use client";

// ============================================================
// src/app/(Main)/admin/stock-receive/components/StockReceiveForm.tsx
// Stock Receive Form with header fields + dynamic items grid.
// Supports Save Draft and Confirm Receive actions.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Plus, Trash2, Loader2, CheckCircle2, Save, ArrowLeft } from "lucide-react";
import { createStockReceive, updateStockReceive, confirmStockReceive, type StockReceiveRow } from "../actions";

interface SupplierOption {
  id: number;
  company: string;
}

interface InventoryOption {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
}

interface StockReceiveFormProps {
  initialData?: StockReceiveRow;
  nextReceiveNo: string;
  suppliers: SupplierOption[];
  inventoryItems: InventoryOption[];
}

type ItemRow = {
  id?: number;
  inventoryId: number;
  qty: number;
  unitCost: number;
  batchNo: string;
  manufactureDate: string;
  expiryDate: string;
};

export default function StockReceiveForm({
  initialData,
  nextReceiveNo,
  suppliers,
  inventoryItems,
}: StockReceiveFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const [receiveNo, setReceiveNo] = useState(initialData?.receiveNo ?? nextReceiveNo);
  const [supplierId, setSupplierId] = useState(initialData?.supplierId ?? (suppliers[0]?.id || 0));
  const [receiveDate, setReceiveDate] = useState(
    initialData?.receiveDate
      ? new Date(initialData.receiveDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [referenceNo, setReferenceNo] = useState(initialData?.referenceNo ?? "");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  const [items, setItems] = useState<ItemRow[]>(
    initialData?.items?.map((i) => ({
      id: i.id,
      inventoryId: i.inventoryId,
      qty: i.qty,
      unitCost: i.unitCost,
      batchNo: i.batchNo ?? "",
      manufactureDate: i.manufactureDate ? new Date(i.manufactureDate).toISOString().slice(0, 10) : "",
      expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().slice(0, 10) : "",
    })) ?? [
      {
        inventoryId: inventoryItems[0]?.id || 0,
        qty: 1,
        unitCost: 0,
        batchNo: "",
        manufactureDate: "",
        expiryDate: "",
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const addItemRow = () => {
    setItems([
      ...items,
      {
        inventoryId: inventoryItems[0]?.id || 0,
        qty: 1,
        unitCost: 0,
        batchNo: "",
        manufactureDate: "",
        expiryDate: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one line item is required.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleSave = async (andConfirm = false) => {
    if (!receiveNo.trim()) {
      toast.error("Receive number is required.");
      return;
    }
    if (!supplierId) {
      toast.error("Supplier is required.");
      return;
    }
    if (items.length === 0) {
      toast.error("At least one line item is required.");
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.inventoryId) {
        toast.error(`Line item #${i + 1} requires an item selection.`);
        return;
      }
      if (item.qty <= 0) {
        toast.error(`Line item #${i + 1} quantity must be greater than zero.`);
        return;
      }
    }

    const payload = {
      id: initialData?.id,
      receiveNo,
      supplierId: Number(supplierId),
      receiveDate,
      referenceNo,
      remarks,
      items: items.map((i) => ({
        id: i.id,
        inventoryId: Number(i.inventoryId),
        qty: Number(i.qty),
        unitCost: Number(i.unitCost),
        batchNo: i.batchNo,
        manufactureDate: i.manufactureDate || null,
        expiryDate: i.expiryDate || null,
      })),
    };

    if (andConfirm) setIsConfirming(true);
    else setIsSubmitting(true);

    try {
      const result = isEdit
        ? await updateStockReceive(payload)
        : await createStockReceive(payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const receiveId = (result.data as any)?.id || initialData?.id;

      if (andConfirm && receiveId) {
        const confirmRes = await confirmStockReceive(receiveId);
        if (confirmRes.success) {
          toast.success(confirmRes.message);
          router.push("/admin/stock-receive");
        } else {
          toast.error(confirmRes.message);
        }
      } else {
        toast.success(result.message);
        router.push("/admin/stock-receive");
      }
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0d1117] border border-[#1e2a3d] p-6 rounded-2xl">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a657a] hover:text-[#e02424] mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Goods Receive List
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-[#dce3ef]">
            {isEdit ? `Edit Goods Receive — ${receiveNo}` : "New Goods Receive Note (GRN)"}
          </h1>
          <p className="text-xs text-[#5a657a] mt-1">
            Status: <span className="font-semibold text-amber-400">{initialData?.status || "DRAFT"}</span> (Batches are created automatically upon confirmation)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting || isConfirming}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#dce3ef] bg-[#161d2e] hover:bg-[#1e2a3d] border border-[#1e2a3d] rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting || isConfirming}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isConfirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirm Receive
          </button>
        </div>
      </div>

      {/* Header Fields Section */}
      <div className="bg-[#0d1117] border border-[#1e2a3d] p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-[#dce3ef] uppercase tracking-wide border-b border-[#1e2a3d] pb-3">
          Header Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5a657a] mb-1">
              Receive No <span className="text-[#e02424]">*</span>
            </label>
            <input
              type="text"
              value={receiveNo}
              onChange={(e) => setReceiveNo(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] font-mono outline-none focus:border-[#e02424]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a657a] mb-1">
              Receive Date <span className="text-[#e02424]">*</span>
            </label>
            <input
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a657a] mb-1">
              Supplier <span className="text-[#e02424]">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
            >
              <option value={0}>Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a657a] mb-1">Reference No (PO / Invoice)</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. PO-99120"
              className="w-full px-3.5 py-2 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#5a657a] mb-1">Remarks / Delivery Notes</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add delivery note details..."
            className="w-full px-3.5 py-2 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="bg-[#0d1117] border border-[#1e2a3d] p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
          <h2 className="text-sm font-bold text-[#dce3ef] uppercase tracking-wide">
            Received Line Items ({items.length})
          </h2>

          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#e02424] bg-[#e02424]/10 hover:bg-[#e02424]/20 border border-[#e02424]/20 rounded-xl transition-colors"
          >
            <Plus size={14} /> Add Line Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#1e2a3d] text-[#3d4c62] uppercase tracking-wide font-semibold">
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3 min-w-[220px]">Item Master *</th>
                <th className="py-2.5 px-3 w-28 text-right">Qty *</th>
                <th className="py-2.5 px-3 w-32 text-right">Unit Cost ($)</th>
                <th className="py-2.5 px-3 w-36">Batch No</th>
                <th className="py-2.5 px-3 w-36">Mfg Date</th>
                <th className="py-2.5 px-3 w-36">Expiry Date</th>
                <th className="py-2.5 px-3 w-28 text-right">Subtotal ($)</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a3d]">
              {items.map((row, idx) => {
                const subtotal = row.qty * row.unitCost;
                return (
                  <tr key={idx} className="hover:bg-[#161d2e]/50 transition-colors">
                    <td className="py-3 px-3 text-[#3d4c62] font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <select
                        value={row.inventoryId}
                        onChange={(e) => updateItemRow(idx, "inventoryId", Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
                      >
                        <option value={0}>Select Item</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            [{inv.itemCode}] {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        value={row.qty}
                        onChange={(e) => updateItemRow(idx, "qty", Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] text-right outline-none focus:border-[#e02424]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.unitCost}
                        onChange={(e) => updateItemRow(idx, "unitCost", Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] text-right outline-none focus:border-[#e02424]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="e.g. BATCH-801"
                        value={row.batchNo}
                        onChange={(e) => updateItemRow(idx, "batchNo", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] font-mono outline-none focus:border-[#e02424]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="date"
                        value={row.manufactureDate}
                        onChange={(e) => updateItemRow(idx, "manufactureDate", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) => updateItemRow(idx, "expiryDate", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#080c12] border border-[#1e2a3d] rounded-xl text-[#dce3ef] outline-none focus:border-[#e02424]"
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-[#dce3ef] tabular-nums">
                      ${subtotal.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-[#5a657a] hover:text-[#e02424] transition-colors"
                        title="Remove Line"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#1e2a3d] pt-4">
          <span className="text-xs text-[#5a657a]">Total Line Items: {items.length}</span>
          <div className="text-right">
            <span className="text-xs text-[#5a657a] mr-2">Grand Total Value:</span>
            <span className="text-lg font-black text-emerald-400 tabular-nums">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
