"use client";

// ============================================================
// src/components/fire-extinguishers/PhysicalUnitsClient.tsx
// Physical Fire Extinguisher Units Management UI
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Flame,
  Shield,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Box,
} from "lucide-react";
import { createFireExtinguisherUnitAction, updateFireExtinguisherUnitAction } from "@/app/actions/fire-extinguishers";
import type { FireExtinguisherUnitStatus } from "@/generated/prisma/client";

interface InventoryItem {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
}

interface PhysicalUnit {
  id: number;
  unitCode: string;
  inventoryId: number;
  status: FireExtinguisherUnitStatus;
  serialNumber: string | null;
  manufactureDate: Date | string | null;
  expiryDate: Date | string | null;
  notes: string | null;
  inventory: InventoryItem;
  assignments?: any[];
}

interface PhysicalUnitsClientProps {
  initialUnits: PhysicalUnit[];
  inventoryItems: InventoryItem[];
  canManage: boolean;
}

const STATUS_BADGES: Record<FireExtinguisherUnitStatus, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: "Available", bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300", text: "text-emerald-800 dark:text-emerald-300" },
  ASSIGNED: { label: "Assigned", bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300", text: "text-blue-800 dark:text-blue-300" },
  UNDER_REFILL: { label: "Under Refill", bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300", text: "text-amber-800 dark:text-amber-300" },
  TEMPORARY_REPLACEMENT: { label: "Temp Replacement", bg: "bg-purple-100 dark:bg-purple-950/60 border-purple-300", text: "text-purple-800 dark:text-purple-300" },
  DAMAGED: { label: "Damaged", bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-300", text: "text-rose-800 dark:text-rose-300" },
  LOST: { label: "Lost", bg: "bg-gray-200 dark:bg-gray-800 border-gray-400", text: "text-gray-800 dark:text-gray-300" },
  RETIRED: { label: "Retired", bg: "bg-gray-100 dark:bg-gray-900 border-gray-300", text: "text-gray-600 dark:text-gray-400" },
};

export function PhysicalUnitsClient({
  initialUnits,
  inventoryItems,
  canManage,
}: PhysicalUnitsClientProps) {
  const [units, setUnits] = useState<PhysicalUnit[]>(initialUnits);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [unitCode, setUnitCode] = useState("");
  const [inventoryId, setInventoryId] = useState<number | "">(inventoryItems[0]?.id || "");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(search.toLowerCase()) ||
      (u.serialNumber && u.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      u.inventory.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = units.filter((u) => u.status === "AVAILABLE").length;
  const assignedCount = units.filter((u) => u.status === "ASSIGNED" || u.status === "TEMPORARY_REPLACEMENT").length;
  const refillCount = units.filter((u) => u.status === "UNDER_REFILL").length;

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim() || !inventoryId) {
      setErrorMsg("Unit Code and Master Inventory Item are required.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createFireExtinguisherUnitAction({
        unitCode: unitCode.trim(),
        inventoryId: Number(inventoryId),
        serialNumber: serialNumber.trim() || undefined,
        manufactureDate: manufactureDate || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        setUnits((prev) => [res.data as PhysicalUnit, ...prev]);
        setIsModalOpen(false);
        setUnitCode("");
        setSerialNumber("");
        setManufactureDate("");
        setExpiryDate("");
        setNotes("");
      } else {
        setErrorMsg(res.message || "Failed to create physical unit.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Physical Units</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{units.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Available in Warehouse</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{availableCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Box size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Assigned (Site / Client)</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{assignedCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <RefreshCw size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Under Refill</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{refillCount}</div>
          </div>
        </div>
      </div>

      {/* Control Strip & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Unit Code, Serial No, Item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_REFILL">Under Refill</option>
              <option value="TEMPORARY_REPLACEMENT">Temp Replacement</option>
              <option value="DAMAGED">Damaged</option>
              <option value="LOST">Lost</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus size={16} /> Register Physical Unit
          </button>
        )}
      </div>

      {/* Physical Units Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Unit Code</th>
                <th className="py-3.5 px-4">Master Item</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Current Location</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No physical fire extinguisher units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const badge = STATUS_BADGES[u.status] || STATUS_BADGES.AVAILABLE;
                  const activeAssign = u.assignments?.[0];
                  let locStr = "Main Warehouse";
                  if (activeAssign?.project) {
                    locStr = `Project: ${activeAssign.project.projectName}`;
                  } else if (activeAssign?.customer) {
                    locStr = `Client: ${activeAssign.customer.companyName}`;
                  }

                  const isExpiringSoon = u.expiryDate && new Date(u.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Flame size={14} className="text-red-600" />
                        <span>{u.unitCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{u.inventory.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{u.inventory.itemCode}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">
                        {u.serialNumber || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {locStr}
                      </td>
                      <td className="py-3 px-4">
                        {u.expiryDate ? (
                          <div className={`flex items-center gap-1 font-mono text-[11px] ${isExpiringSoon ? "text-amber-600 font-bold" : "text-gray-500"}`}>
                            {isExpiringSoon && <AlertTriangle size={12} />}
                            <span>{new Date(u.expiryDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/fire-extinguishers/${encodeURIComponent(u.unitCode)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> View History
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Flame className="text-red-600" size={18} /> Register Physical Fire Extinguisher Unit
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Master Inventory Item *
                </label>
                <select
                  value={inventoryId}
                  onChange={(e) => setInventoryId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Unit Code (Asset Tag) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FE-0001"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-987654"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    value={manufactureDate}
                    onChange={(e) => setManufactureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Refill / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Specification
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional unit specifications..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Create Physical Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
