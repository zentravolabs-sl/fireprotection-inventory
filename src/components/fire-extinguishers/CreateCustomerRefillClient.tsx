"use client";

// ============================================================
// src/components/fire-extinguishers/CreateCustomerRefillClient.tsx
// Create Customer Refill Job — Full Form Client Component
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Flame,
  Box,
  Building2,
  AlertCircle,
  PackageCheck,
  Info,
} from "lucide-react";
import { createCustomerRefillAction } from "@/app/actions/customer-refills";

interface CustomerOption {
  id: number;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
}

interface InventoryStockItem {
  id: number;
  itemCode: string;
  name: string;
  availableStock: number;
}

interface CustomerItemRow {
  _id: string;
  extinguisherType: string;
  capacity: string;
  receivedQty: number | "";
  notes: string;
}

interface ReplacementRow {
  _id: string;
  inventoryId: number | "";
  issuedQty: number | "";
  notes: string;
}

interface Props {
  customers: CustomerOption[];
  inventoryItems: InventoryStockItem[];
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export function CreateCustomerRefillClient({ customers, inventoryItems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Header fields
  const [customerId, setCustomerId] = useState<number | "">(customers[0]?.id ?? "");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // Customer-owned items
  const [items, setItems] = useState<CustomerItemRow[]>([
    { _id: uid(), extinguisherType: "", capacity: "", receivedQty: 1, notes: "" },
  ]);

  // Temporary replacements
  const [hasReplacements, setHasReplacements] = useState(false);
  const [replacements, setReplacements] = useState<ReplacementRow[]>([]);

  const addItem = () =>
    setItems((p) => [...p, { _id: uid(), extinguisherType: "", capacity: "", receivedQty: 1, notes: "" }]);

  const removeItem = (id: string) =>
    setItems((p) => (p.length > 1 ? p.filter((r) => r._id !== id) : p));

  const addReplacement = () => {
    if (inventoryItems.length === 0) return;
    setReplacements((p) => [
      ...p,
      { _id: uid(), inventoryId: inventoryItems[0].id, issuedQty: 1, notes: "" },
    ]);
  };

  const removeReplacement = (id: string) =>
    setReplacements((p) => p.filter((r) => r._id !== id));

  const toggleReplacement = (checked: boolean) => {
    setHasReplacements(checked);
    if (checked && replacements.length === 0) addReplacement();
  };

  const submit = (asDraft: boolean) => {
    setError(null);
    if (!customerId) { setError("Please select a customer."); return; }
    for (const item of items) {
      if (!item.extinguisherType.trim()) { setError("All fire extinguisher type fields are required."); return; }
      if (!item.receivedQty || Number(item.receivedQty) <= 0) { setError("Received quantity must be greater than 0."); return; }
    }
    if (hasReplacements) {
      for (const repl of replacements) {
        if (!repl.inventoryId) { setError("Select an inventory item for all replacements."); return; }
        const inv = inventoryItems.find((i) => i.id === Number(repl.inventoryId));
        const qty = Number(repl.issuedQty) || 0;
        if (qty <= 0) { setError("Replacement issue quantity must be greater than 0."); return; }
        if (inv && qty > inv.availableStock) {
          setError(`Requested qty (${qty}) for '${inv.name}' exceeds available stock (${inv.availableStock}).`);
          return;
        }
      }
    }

    startTransition(async () => {
      const result = await createCustomerRefillAction({
        customerId: Number(customerId),
        receivedDate,
        notes: notes.trim() || undefined,
        status: asDraft ? "DRAFT" : "RECEIVED",
        items: items.map((i) => ({
          extinguisherType: i.extinguisherType.trim(),
          capacity: i.capacity.trim() || undefined,
          receivedQty: Number(i.receivedQty),
          notes: i.notes.trim() || undefined,
        })),
        hasReplacements,
        replacements: hasReplacements
          ? replacements.map((r) => ({
              inventoryId: Number(r.inventoryId),
              issuedQty: Number(r.issuedQty),
              notes: r.notes.trim() || undefined,
            }))
          : [],
      });

      if (result.success && result.data) {
        router.push(`/fire-extinguishers/customer-refills/${(result.data as any).id}`);
      } else {
        setError(result.message ?? "An error occurred.");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back nav */}
      <Link
        href="/fire-extinguishers/customer-refills"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customer Refills
      </Link>

      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shrink-0">
          <Flame size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Create Customer Refill Job
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Receive customer-owned fire extinguishers and optionally issue temporary warehouse replacements.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── SECTION 1: Customer Information ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
          <Building2 className="text-blue-600" size={17} />
          <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">
            Section 1: Customer Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}{c.contactPerson ? ` (${c.contactPerson})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Received Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
          <textarea
            rows={2}
            placeholder="Job remarks, special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* ── SECTION 2: Customer's Fire Extinguishers ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Flame className="text-red-600" size={17} />
            <div>
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                Section 2: Customer's Fire Extinguishers
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Info size={11} />
                These are customer-owned. No Unit Code needed. Our stock is unaffected.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-500">
              <tr>
                <th className="py-2.5 px-3">Fire Extinguisher Type <span className="text-rose-500">*</span></th>
                <th className="py-2.5 px-3 w-28">Capacity</th>
                <th className="py-2.5 px-3 w-32">Qty Received <span className="text-rose-500">*</span></th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="e.g. ABC Powder, CO2, Water..."
                      value={item.extinguisherType}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((p) => p.map((r) => r._id === item._id ? { ...r, extinguisherType: v } : r));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="9kg, 5kg..."
                      value={item.capacity}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((p) => p.map((r) => r._id === item._id ? { ...r, capacity: v } : r));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0.01"
                      step="1"
                      value={item.receivedQty}
                      onChange={(e) => {
                        const v = e.target.value === "" ? "" : Number(e.target.value);
                        setItems((p) => p.map((r) => r._id === item._id ? { ...r, receivedQty: v } : r));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono font-bold focus:ring-2 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Condition, notes..."
                      value={item.notes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((p) => p.map((r) => r._id === item._id ? { ...r, notes: v } : r));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item._id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 3: Temporary Replacements ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Box className="text-purple-600" size={17} />
            <div>
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                Section 3: Temporary Replacement
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Issued from OUR warehouse stock. Generates Stock Movement OUT.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900">
            <input
              type="checkbox"
              checked={hasReplacements}
              onChange={(e) => toggleReplacement(e.target.checked)}
              className="accent-purple-600"
            />
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
              Temporary Replacement Required?
            </span>
          </label>
        </div>

        {hasReplacements && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addReplacement}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Replacement
              </button>
            </div>

            {replacements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No replacements added.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-purple-200 dark:border-purple-900/50">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-50/60 dark:bg-purple-950/20 text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300">
                    <tr>
                      <th className="py-2.5 px-3">Our Inventory Item <span className="text-rose-500">*</span></th>
                      <th className="py-2.5 px-3 text-center w-28">Available Stock</th>
                      <th className="py-2.5 px-3 w-32">Issue Qty <span className="text-rose-500">*</span></th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30">
                    {replacements.map((repl) => {
                      const inv = inventoryItems.find((i) => i.id === Number(repl.inventoryId));
                      const avail = inv?.availableStock ?? 0;
                      const over = Number(repl.issuedQty) > avail;
                      return (
                        <tr key={repl._id}>
                          <td className="py-2 px-3">
                            <select
                              value={repl.inventoryId}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setReplacements((p) => p.map((r) => r._id === repl._id ? { ...r, inventoryId: v } : r));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                            >
                              {inventoryItems.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.name} ({i.itemCode}) — Avail: {i.availableStock}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">
                            {avail}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={repl.issuedQty}
                              onChange={(e) => {
                                const v = e.target.value === "" ? "" : Number(e.target.value);
                                setReplacements((p) => p.map((r) => r._id === repl._id ? { ...r, issuedQty: v } : r));
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs rounded border font-mono font-bold ${
                                over
                                  ? "border-rose-500 bg-rose-50 text-rose-900"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              } focus:ring-2 focus:ring-purple-500`}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Tag, serial..."
                              value={repl.notes}
                              onChange={(e) => {
                                const v = e.target.value;
                                setReplacements((p) => p.map((r) => r._id === repl._id ? { ...r, notes: v } : r));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => removeReplacement(repl._id)}
                              className="text-gray-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Submit Buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={isPending}
          className="px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md hover:shadow-lg shadow-red-500/25 transition-all disabled:opacity-50"
        >
          <PackageCheck size={16} />
          {isPending
            ? "Processing..."
            : hasReplacements
            ? "Receive & Issue Replacement"
            : "Receive for Refill"}
        </button>
      </div>
    </div>
  );
}
