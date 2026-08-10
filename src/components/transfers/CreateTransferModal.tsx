"use client";

// ============================================================
// src/components/transfers/CreateTransferModal.tsx
// Modal form for creating a new Project to Project Stock Transfer
// ============================================================

import React, { useState, useEffect } from "react";
import {
  createProjectTransferAction,
  getAvailableStockAction,
} from "@/app/actions/transfers";
import { formatCurrency } from "@/lib/dateUtils";

interface ProjectOption {
  id: number;
  projectCode: string;
  projectName: string;
}

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projects: ProjectOption[];
  defaultFromProjectId?: number;
}

type ItemType = "MATERIAL" | "PIPE_CUT" | "TOOL";

interface TransferItemDraft {
  id: string;
  itemType: ItemType;
  inventoryId?: number;
  stockBatchId?: number;
  pipeCutPieceId?: number;
  toolId?: number;
  name: string;
  code: string;
  qty: number;
  availableQty: number;
  unit: string;
  unitCost: number;
  remarks?: string;
}

export function CreateTransferModal({
  isOpen,
  onClose,
  onSuccess,
  projects,
  defaultFromProjectId,
}: CreateTransferModalProps) {
  const [fromProjectId, setFromProjectId] = useState<number>(
    defaultFromProjectId || (projects[0]?.id || 0)
  );
  const [toProjectId, setToProjectId] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState<string>("");

  // Source stock available data
  const [stockLoading, setStockLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState<{
    materials: any[];
    pipeCutPieces: any[];
    tools: any[];
  }>({ materials: [], pipeCutPieces: [], tools: [] });

  // Items draft list
  const [items, setItems] = useState<TransferItemDraft[]>([]);

  // Item selector state
  const [selectedType, setSelectedType] = useState<ItemType>("MATERIAL");
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>("");
  const [selectedPipeKey, setSelectedPipeKey] = useState<string>("");
  const [selectedToolKey, setSelectedToolKey] = useState<string>("");
  const [inputQty, setInputQty] = useState<number>(1);
  const [itemRemarks, setItemRemarks] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load source stock when source project changes
  useEffect(() => {
    if (fromProjectId && isOpen) {
      fetchSourceStock(fromProjectId);
    }
  }, [fromProjectId, isOpen]);

  async function fetchSourceStock(projId: number) {
    setStockLoading(true);
    setAvailableStock({ materials: [], pipeCutPieces: [], tools: [] });
    setItems([]);
    setSelectedMaterialKey("");
    setSelectedPipeKey("");
    setSelectedToolKey("");

    const res = await getAvailableStockAction(projId);
    setStockLoading(false);
    if (res.success && res.data) {
      setAvailableStock(res.data);
    }
  }

  if (!isOpen) return null;

  const availableDestinationProjects = projects.filter(
    (p) => p.id !== Number(fromProjectId)
  );

  function handleAddItem() {
    setError(null);

    if (selectedType === "MATERIAL") {
      if (!selectedMaterialKey) {
        setError("Please select a material.");
        return;
      }

      const found = availableStock.materials.find(
        (m) => `${m.inventoryId}_${m.stockBatchId}` === selectedMaterialKey
      );

      if (!found) {
        setError("Selected material not found in source stock.");
        return;
      }

      if (inputQty <= 0) {
        setError("Quantity must be greater than 0.");
        return;
      }

      if (inputQty > found.availableQty) {
        setError(`Insufficient stock. Available: ${found.availableQty} ${found.unit}`);
        return;
      }

      const existingIndex = items.findIndex(
        (i) => i.inventoryId === found.inventoryId && i.stockBatchId === found.stockBatchId
      );

      if (existingIndex >= 0) {
        setError("This material item is already added to the transfer list.");
        return;
      }

      setItems([
        ...items,
        {
          id: Math.random().toString(),
          itemType: "MATERIAL",
          inventoryId: found.inventoryId,
          stockBatchId: found.stockBatchId,
          name: found.name,
          code: `${found.itemCode} (${found.batchNo})`,
          qty: inputQty,
          availableQty: found.availableQty,
          unit: found.unit,
          unitCost: found.unitCost,
          remarks: itemRemarks || undefined,
        },
      ]);
    } else if (selectedType === "PIPE_CUT") {
      if (!selectedPipeKey) {
        setError("Please select a pipe cut piece.");
        return;
      }

      const found = availableStock.pipeCutPieces.find(
        (pc) => String(pc.id) === selectedPipeKey
      );

      if (!found) {
        setError("Selected pipe cut piece not found.");
        return;
      }

      const existingIndex = items.findIndex((i) => i.pipeCutPieceId === found.id);
      if (existingIndex >= 0) {
        setError("This pipe cut piece is already added to the transfer list.");
        return;
      }

      setItems([
        ...items,
        {
          id: Math.random().toString(),
          itemType: "PIPE_CUT",
          pipeCutPieceId: found.id,
          name: `Pipe Cut Piece — ${found.name}`,
          code: found.barcode ? `Barcode: ${found.barcode}` : `ID: #${found.id}`,
          qty: found.pieceLength,
          availableQty: found.pieceLength,
          unit: found.unit,
          unitCost: found.unitCost || 0,
          remarks: itemRemarks || undefined,
        },
      ]);
    } else if (selectedType === "TOOL") {
      if (!selectedToolKey) {
        setError("Please select a tool.");
        return;
      }

      const found = availableStock.tools.find(
        (t) => String(t.toolId) === selectedToolKey
      );

      if (!found) {
        setError("Selected tool not found.");
        return;
      }

      const existingIndex = items.findIndex((i) => i.toolId === found.toolId);
      if (existingIndex >= 0) {
        setError("This tool is already added to the transfer list.");
        return;
      }

      setItems([
        ...items,
        {
          id: Math.random().toString(),
          itemType: "TOOL",
          toolId: found.toolId,
          name: found.name,
          code: `${found.toolCode} (S/N: ${found.serialNo || "N/A"})`,
          qty: 1,
          availableQty: 1,
          unit: "UNIT",
          unitCost: 0,
          remarks: itemRemarks || undefined,
        },
      ]);
    }

    // Reset item selector fields
    setSelectedMaterialKey("");
    setSelectedPipeKey("");
    setSelectedToolKey("");
    setInputQty(1);
    setItemRemarks("");
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  async function handleSubmit(submitDirectly: boolean = false) {
    setError(null);

    if (!fromProjectId) {
      setError("Source project is required.");
      return;
    }

    if (!toProjectId) {
      setError("Destination project is required.");
      return;
    }

    if (Number(fromProjectId) === Number(toProjectId)) {
      setError("Source and destination projects must be different.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one item to the transfer.");
      return;
    }

    setLoading(true);

    const payload = {
      fromProjectId: Number(fromProjectId),
      toProjectId: Number(toProjectId),
      transferDate,
      remarks,
      items: items.map((i) => ({
        inventoryId: i.inventoryId,
        stockBatchId: i.stockBatchId,
        pipeCutPieceId: i.pipeCutPieceId,
        toolId: i.toolId,
        qty: i.qty,
        unit: i.unit,
        unitCost: i.unitCost,
        remarks: i.remarks,
      })),
    };

    const res = await createProjectTransferAction(payload);

    setLoading(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    onClose();
    if (onSuccess) onSuccess();
  }

  const totalTransferValue = items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
          <div>
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <span className="text-red-500">🔄</span> Project to Project Stock Transfer
            </h2>
            <p className="text-xs text-gray-400">
              Directly transfer materials, cut pieces, or tools between projects.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl font-bold p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Project Header Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                FROM PROJECT (Source) <span className="text-red-400">*</span>
              </label>
              <select
                value={fromProjectId}
                onChange={(e) => setFromProjectId(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                TO PROJECT (Destination) <span className="text-red-400">*</span>
              </label>
              <select
                value={toProjectId}
                onChange={(e) => setToProjectId(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500 font-medium"
              >
                <option value={0}>-- Select Destination Project --</option>
                {availableDestinationProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Transfer Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Add Items from Source Project</h3>
              {stockLoading && <span className="text-gray-400 text-[11px] animate-pulse">Loading stock...</span>}
            </div>

            {/* Type Selector Tabs */}
            <div className="flex gap-2 border-b border-gray-800 pb-2">
              <button
                type="button"
                onClick={() => setSelectedType("MATERIAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === "MATERIAL"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                📦 Consumable Material ({availableStock.materials.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("PIPE_CUT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === "PIPE_CUT"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                🔧 Pipe Cut Piece ({availableStock.pipeCutPieces.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("TOOL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === "TOOL"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                🔨 Assigned Tool ({availableStock.tools.length})
              </button>
            </div>

            {/* Selector Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {selectedType === "MATERIAL" && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 mb-1">Select Material Item</label>
                    <select
                      value={selectedMaterialKey}
                      onChange={(e) => setSelectedMaterialKey(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                    >
                      <option value="">-- Choose Material --</option>
                      {availableStock.materials.map((m) => (
                        <option
                          key={`${m.inventoryId}_${m.stockBatchId}`}
                          value={`${m.inventoryId}_${m.stockBatchId}`}
                        >
                          {m.name} [{m.itemCode}] — Avail: {m.availableQty} {m.unit} ({m.batchNo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Transfer Qty</label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={inputQty}
                      onChange={(e) => setInputQty(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 font-semibold"
                    />
                  </div>
                </>
              )}

              {selectedType === "PIPE_CUT" && (
                <div className="md:col-span-3">
                  <label className="block text-gray-400 mb-1">Select Pipe Cut Piece</label>
                  <select
                    value={selectedPipeKey}
                    onChange={(e) => setSelectedPipeKey(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                  >
                    <option value="">-- Choose Pipe Cut Piece --</option>
                    {availableStock.pipeCutPieces.map((pc) => (
                      <option key={pc.id} value={pc.id}>
                        {pc.name} — Length: {pc.pieceLength} {pc.unit} ({pc.barcode || `#${pc.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedType === "TOOL" && (
                <div className="md:col-span-3">
                  <label className="block text-gray-400 mb-1">Select Assigned Tool</label>
                  <select
                    value={selectedToolKey}
                    onChange={(e) => setSelectedToolKey(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                  >
                    <option value="">-- Choose Tool --</option>
                    {availableStock.tools.map((t) => (
                      <option key={t.toolId} value={t.toolId}>
                        {t.name} [{t.toolCode}] (S/N: {t.serialNo || "N/A"}) — {t.condition}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  + Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Transfer Items Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-200">Transfer Line Items ({items.length})</h3>
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-gray-950 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Item & Reference</th>
                    <th className="px-4 py-2.5 text-right">Transfer Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Cost</th>
                    <th className="px-4 py-2.5 text-right">Total Cost</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No transfer items added yet. Select items above.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/40">
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.itemType === "MATERIAL"
                                ? "bg-teal-950 text-teal-300 border border-teal-800"
                                : item.itemType === "PIPE_CUT"
                                ? "bg-blue-950 text-blue-300 border border-blue-800"
                                : "bg-purple-950 text-purple-300 border border-purple-800"
                            }`}
                          >
                            {item.itemType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-100">
                          {item.name}
                          <div className="text-[11px] text-gray-400 font-mono">{item.code}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-100">
                          {item.qty} {item.unit}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                          {formatCurrency(item.qty * item.unitCost)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-400 hover:text-red-300 font-semibold p-1 hover:bg-red-950/50 rounded"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot className="bg-gray-950 font-bold text-gray-100 border-t border-gray-800">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right">
                        Total Transfer Value:
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                        {formatCurrency(totalTransferValue)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">Transfer Remarks / Notes</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reason or context for this project transfer..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-gray-100 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Draft Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
