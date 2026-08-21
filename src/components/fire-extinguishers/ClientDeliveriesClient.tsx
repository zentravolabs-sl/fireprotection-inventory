"use client";

// ============================================================
// src/components/fire-extinguishers/ClientDeliveriesClient.tsx
// Client Delivery Notes UI with Available Fire Extinguisher Unit Selection
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Printer,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  Calendar,
  Flame,
  CheckSquare,
  Square,
  Eye,
} from "lucide-react";
import {
  createDeliveryNoteAction,
  confirmDeliveryNoteAction,
  cancelDeliveryNoteAction,
} from "@/app/actions/fire-extinguishers";
import type { DeliveryStatus } from "@/generated/prisma/client";

interface CustomerItem {
  id: number;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
}

interface AvailableUnit {
  id: number;
  unitCode: string;
  serialNumber: string | null;
  expiryDate: Date | string | null;
  inventory: {
    name: string;
    itemCode: string;
    unit: string;
  };
}

interface DeliveryNoteItem {
  id: number;
  fireExtinguisherUnit: AvailableUnit;
}

interface DeliveryNote {
  id: number;
  deliveryNo: string;
  customerId: number;
  deliveryDate: Date | string;
  deliveryAddress: string | null;
  notes: string | null;
  status: DeliveryStatus;
  customer: CustomerItem;
  items: DeliveryNoteItem[];
  createdBy?: { name: string } | null;
}

interface ClientDeliveriesClientProps {
  initialDeliveries: DeliveryNote[];
  customers: CustomerItem[];
  availableUnits: AvailableUnit[];
  canDeliver: boolean;
}

const STATUS_BADGES: Record<DeliveryStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "Draft", bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300", text: "text-amber-800 dark:text-amber-300" },
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300", text: "text-blue-800 dark:text-blue-300" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300", text: "text-emerald-800 dark:text-emerald-300" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-300", text: "text-rose-800 dark:text-rose-300" },
};

export function ClientDeliveriesClient({
  initialDeliveries,
  customers,
  availableUnits,
  canDeliver,
}: ClientDeliveriesClientProps) {
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>(initialDeliveries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(customers[0]?.id || "");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);

  const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.deliveryNo.toLowerCase().includes(search.toLowerCase()) ||
      d.customer.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (d.deliveryAddress && d.deliveryAddress.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleUnitSelection = (unitId: number) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const selectAllAvailable = () => {
    if (selectedUnitIds.length === availableUnits.length) {
      setSelectedUnitIds([]);
    } else {
      setSelectedUnitIds(availableUnits.map((u) => u.id));
    }
  };

  const handleCreateDelivery = (confirmImmediately: boolean) => {
    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    if (selectedUnitIds.length === 0) {
      setErrorMsg("Please select at least one available Fire Extinguisher Unit.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      // 1. Create Draft Delivery Note
      const res = await createDeliveryNoteAction({
        customerId: Number(selectedCustomerId),
        deliveryDate,
        deliveryAddress: deliveryAddress.trim() || selectedCustomer?.address || undefined,
        notes: notes.trim() || undefined,
        unitIds: selectedUnitIds,
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.message || "Failed to create delivery note.");
        return;
      }

      let createdNote: any = res.data;

      // 2. If user clicked Confirm Delivery immediately
      if (confirmImmediately && createdNote?.id) {
        const confirmRes = await confirmDeliveryNoteAction(createdNote.id);
        if (confirmRes.success && confirmRes.data) {
          createdNote = confirmRes.data;
        } else {
          setErrorMsg(confirmRes.message || "Delivery note saved as draft, but confirmation failed.");
        }
      }

      setDeliveries((prev) => [createdNote as DeliveryNote, ...prev]);
      setIsModalOpen(false);
      setSelectedUnitIds([]);
      setNotes("");
      setDeliveryAddress("");
    });
  };

  const handleConfirmExisting = (id: number) => {
    startTransition(async () => {
      const res = await confirmDeliveryNoteAction(id);
      if (res.success && res.data) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? (res.data as DeliveryNote) : d))
        );
      } else {
        alert(res.message || "Failed to confirm delivery note.");
      }
    });
  };

  const handleCancelExisting = (id: number) => {
    if (!confirm("Are you sure you want to cancel this draft delivery note?")) return;
    startTransition(async () => {
      const res = await cancelDeliveryNoteAction(id);
      if (res.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "CANCELLED" as DeliveryStatus } : d))
        );
      } else {
        alert(res.message || "Failed to cancel delivery note.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Strip & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Delivery No, Customer, Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {canDeliver && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus size={16} /> Create Delivery Note
          </button>
        )}
      </div>

      {/* Delivery Notes Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Delivery No</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Total Units</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No client delivery notes found.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d) => {
                  const badge = STATUS_BADGES[d.status] || STATUS_BADGES.DRAFT;

                  return (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText size={14} className="text-red-600" />
                        <span>{d.deliveryNo}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {d.customer.companyName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(d.deliveryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-gray-100">
                        {d.items?.length || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {d.createdBy?.name || "System"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/fire-extinguishers/deliveries/${d.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Printer size={13} /> Print
                          </Link>

                          {d.status === "DRAFT" && canDeliver && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmExisting(d.id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              >
                                <CheckCircle2 size={13} /> Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelExisting(d.id)}
                                disabled={isPending}
                                className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                                title="Cancel Draft"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Delivery Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Truck className="text-red-600" size={18} /> Create Direct Client Delivery Note
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Select Customer / Client *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedCustomerId(id);
                      const cust = customers.find((c) => c.id === id);
                      if (cust?.address) setDeliveryAddress(cust.address);
                    }}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Street Address, Building, Premises..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Fire Extinguisher Available Unit Selection Table */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="text-red-600" size={14} />
                    <span>Select Available Fire Extinguishers ({selectedUnitIds.length} Selected)</span>
                  </span>
                  <button
                    type="button"
                    onClick={selectAllAvailable}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    {selectedUnitIds.length === availableUnits.length ? "Deselect All" : "Select All Available"}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-8"></th>
                        <th className="py-2 px-3">Unit Code</th>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Serial No</th>
                        <th className="py-2 px-3">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {availableUnits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                            No AVAILABLE fire extinguisher units found in warehouse.
                          </td>
                        </tr>
                      ) : (
                        availableUnits.map((u) => {
                          const isSelected = selectedUnitIds.includes(u.id);
                          return (
                            <tr
                              key={u.id}
                              onClick={() => toggleUnitSelection(u.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-red-50/70 dark:bg-red-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                              }`}
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded text-red-600 focus:ring-red-500 accent-red-600"
                                />
                              </td>
                              <td className="py-2 px-3 font-bold text-gray-900 dark:text-gray-100">
                                {u.unitCode}
                              </td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                                {u.inventory.name} ({u.inventory.unit})
                              </td>
                              <td className="py-2 px-3 font-mono text-gray-500">
                                {u.serialNumber || "—"}
                              </td>
                              <td className="py-2 px-3 font-mono text-gray-500">
                                {u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or delivery notes..."
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
                  type="button"
                  onClick={() => handleCreateDelivery(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateDelivery(true)}
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Confirm & Deliver Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
