"use client";

// ============================================================
// src/components/fire-extinguishers/RefillManagementClient.tsx
// Refill Management UI (Start Refill, Replacement Unit & Complete Refill)
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Flame,
  Search,
  Calendar,
  AlertCircle,
  Building,
  Box,
  Eye,
  ArrowRight,
} from "lucide-react";
import {
  startRefillAction,
  bulkStartRefillAction,
  completeRefillAction,
} from "@/app/actions/fire-extinguishers";
import { formatDate } from "@/lib/dateUtils";

import type { RefillStatus } from "@/generated/prisma/client";

interface ExtinguisherRefillItem {
  id: number;
  fireExtinguisherAssignmentId: number;
  fireExtinguisherUnitId: number;
  receivedDate: Date | string;
  completedDate: Date | string | null;
  status: RefillStatus;
  replacementUnitId: number | null;
  notes: string | null;
  fireExtinguisherUnit: {
    unitCode: string;
    serialNumber: string | null;
    inventory: { name: string; itemCode: string; unit: string };
  };
  assignment: {
    id: number;
    location: string | null;
    project: { projectName: string; projectCode: string } | null;
    customer: { companyName: string } | null;
  };
  replacementUnit?: {
    unitCode: string;
    serialNumber: string | null;
    inventory: { name: string };
  } | null;
}

interface ActiveAssignmentItem {
  id: number;
  fireExtinguisherUnitId: number;
  fireExtinguisherUnit: {
    id: number;
    unitCode: string;
    inventoryId: number;
    inventory: { name: string; itemCode: string; unit: string };
  };
  project: { id?: number; projectName: string; projectCode: string } | null;
  customer: { id?: number; companyName: string } | null;
  location: string | null;
}


interface AvailableReplacementUnit {
  id: number;
  unitCode: string;
  inventoryId: number;
  inventory: { name: string; itemCode: string };
}

interface RefillManagementClientProps {
  initialRefills: ExtinguisherRefillItem[];
  activeAssignments: ActiveAssignmentItem[];
  availableReplacements: AvailableReplacementUnit[];
  canRefill: boolean;
}

export function RefillManagementClient({
  initialRefills,
  activeAssignments,
  availableReplacements,
  canRefill,
}: RefillManagementClientProps) {
  const [refills, setRefills] = useState<ExtinguisherRefillItem[]>(initialRefills);
  const [activeTab, setActiveTab] = useState<"UNDER_REFILL" | "HISTORY" | "COMPLETED">("UNDER_REFILL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedRefillToComplete, setSelectedRefillToComplete] = useState<ExtinguisherRefillItem | null>(null);

  // Start Refill Form State
  const [refillTargetType, setRefillTargetType] = useState<"ALL" | "PROJECT" | "CLIENT">("PROJECT");
  const [selectedFilterProjectId, setSelectedFilterProjectId] = useState<number | "">("");
  const [selectedFilterCustomerId, setSelectedFilterCustomerId] = useState<number | "">("");
  const [unitModalSearch, setUnitModalSearch] = useState("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [replacementRequired, setReplacementRequired] = useState(false);
  const [selectedReplacementUnitId, setSelectedReplacementUnitId] = useState<number | "">("");
  const [startNotes, setStartNotes] = useState("");

  // Complete Refill Form State
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().slice(0, 10));
  const [completeNotes, setCompleteNotes] = useState("");

  // Unique projects & customers from active assignments
  const uniqueProjects = React.useMemo(() => {
    const map = new Map<number, { id: number; projectName: string; projectCode: string }>();
    activeAssignments.forEach((a) => {
      if (a.project && a.project.id) {
        map.set(a.project.id, { id: a.project.id, projectName: a.project.projectName, projectCode: a.project.projectCode });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [activeAssignments]);

  const uniqueCustomers = React.useMemo(() => {
    const map = new Map<number, { id: number; companyName: string }>();
    activeAssignments.forEach((a) => {
      if (a.customer && a.customer.id) {
        map.set(a.customer.id, { id: a.customer.id, companyName: a.customer.companyName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [activeAssignments]);

  // Filtered active assignments for the refill modal
  const modalActiveAssignments = React.useMemo(() => {
    return activeAssignments.filter((a) => {
      if (refillTargetType === "PROJECT" && selectedFilterProjectId) {
        if (a.project?.id !== Number(selectedFilterProjectId)) return false;
      }
      if (refillTargetType === "CLIENT" && selectedFilterCustomerId) {
        if (a.customer?.id !== Number(selectedFilterCustomerId)) return false;
      }

      if (unitModalSearch.trim()) {
        const query = unitModalSearch.toLowerCase();
        const matchCode = a.fireExtinguisherUnit.unitCode.toLowerCase().includes(query);
        const matchName = a.fireExtinguisherUnit.inventory.name.toLowerCase().includes(query);
        const matchItemCode = a.fireExtinguisherUnit.inventory.itemCode.toLowerCase().includes(query);
        const matchLoc = (a.location || "").toLowerCase().includes(query);
        return matchCode || matchName || matchItemCode || matchLoc;
      }

      return true;
    });
  }, [activeAssignments, refillTargetType, selectedFilterProjectId, selectedFilterCustomerId, unitModalSearch]);

  const toggleAssignmentSelection = (id: number) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllModalAssignments = () => {
    if (selectedAssignmentIds.length === modalActiveAssignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(modalActiveAssignments.map((a) => a.id));
    }
  };

  const selectedFirstAssignment = activeAssignments.find((a) => a.id === selectedAssignmentIds[0]);

  // Compatible replacements (same inventory item as first selected unit)
  const compatibleReplacements = availableReplacements.filter((r) =>
    selectedFirstAssignment ? r.inventoryId === selectedFirstAssignment.fireExtinguisherUnit.inventoryId : true
  );


  const filteredRefills = refills.filter((r) => {
    const unitCode = r.fireExtinguisherUnit.unitCode.toLowerCase();
    const itemName = r.fireExtinguisherUnit.inventory.name.toLowerCase();
    const siteName = (r.assignment.project?.projectName || r.assignment.customer?.companyName || "").toLowerCase();
    const term = search.toLowerCase();

    const matchesSearch = unitCode.includes(term) || itemName.includes(term) || siteName.includes(term);

    if (activeTab === "UNDER_REFILL") {
      return matchesSearch && (r.status === "RECEIVED" || r.status === "IN_PROGRESS");
    } else if (activeTab === "COMPLETED") {
      return matchesSearch && r.status === "COMPLETED";
    }
    return matchesSearch; // HISTORY tab shows all
  });

  const handleStartRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssignmentIds.length === 0) {
      setErrorMsg("Please select at least one active unit to send for refill.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      let res;
      if (selectedAssignmentIds.length === 1) {
        // Single unit refill (can include temporary replacement)
        res = await startRefillAction({
          assignmentId: selectedAssignmentIds[0],
          receivedDate,
          replacementUnitId: replacementRequired && selectedReplacementUnitId ? Number(selectedReplacementUnitId) : undefined,
          notes: startNotes.trim() || undefined,
        });
      } else {
        // Bulk unit refill
        res = await bulkStartRefillAction({
          assignmentIds: selectedAssignmentIds,
          receivedDate,
          notes: startNotes.trim() || undefined,
        });
      }

      if (res.success) {
        setIsStartModalOpen(false);
        setSelectedAssignmentIds([]);
        setStartNotes("");
        setReplacementRequired(false);
        setSelectedReplacementUnitId("");
        window.location.reload();
      } else {
        setErrorMsg(res.message || "Failed to start refill process.");
      }
    });
  };


  const handleCompleteRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefillToComplete) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await completeRefillAction({
        refillId: selectedRefillToComplete.id,
        completedDate,
        notes: completeNotes.trim() || undefined,
      });

      if (res.success) {
        setIsCompleteModalOpen(false);
        setSelectedRefillToComplete(null);
        setCompleteNotes("");
        window.location.reload();
      } else {
        setErrorMsg(res.message || "Failed to complete refill.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-gray-200 dark:border-gray-800 w-full sm:w-auto">
          {(["UNDER_REFILL", "COMPLETED", "HISTORY"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              UNDER_REFILL: "Under Refill",
              COMPLETED: "Completed",
              HISTORY: "Refill History",
            };

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search Unit, Item, Site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {canRefill && (
            <button
              type="button"
              onClick={() => setIsStartModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <RefreshCw size={15} /> Start Refill
            </button>
          )}
        </div>
      </div>

      {/* Refills Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Original Unit</th>
                <th className="py-3.5 px-4">Item Description</th>
                <th className="py-3.5 px-4">Origin / Location</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Temp Replacement</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredRefills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No refill records found.
                  </td>
                </tr>
              ) : (
                filteredRefills.map((r) => {
                  const isUnderRefill = r.status === "RECEIVED" || r.status === "IN_PROGRESS";
                  const siteName = r.assignment.project
                    ? `Project: ${r.assignment.project.projectName}`
                    : r.assignment.customer
                    ? `Client: ${r.assignment.customer.companyName}`
                    : "Unknown";

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Flame size={14} className="text-amber-500" />
                        <span>{r.fireExtinguisherUnit.unitCode}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {r.fireExtinguisherUnit.inventory.name}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                        {siteName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                        {formatDate(r.receivedDate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 dark:text-purple-400 font-bold">
                        {r.replacementUnit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 border border-purple-300">
                            {r.replacementUnit.unitCode}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 font-normal">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {r.status === "COMPLETED" ? "Completed" : "Under Refill"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/fire-extinguishers/${encodeURIComponent(r.fireExtinguisherUnit.unitCode)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Eye size={13} /> View
                          </Link>

                          {isUnderRefill && canRefill && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRefillToComplete(r);
                                setIsCompleteModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                            >
                              <CheckCircle2 size={13} /> Complete Refill
                            </button>
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

      {/* Start Refill Modal — Project & Client Wise Multi-Select */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <RefreshCw className="text-red-600" size={18} /> Start Extinguisher Refill Flow
              </h3>
              <button
                type="button"
                onClick={() => setIsStartModalOpen(false)}
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

            <form onSubmit={handleStartRefill} className="space-y-4">
              {/* Radio Target Type Selection */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Filter Active Units By *
                </label>
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <label className="flex items-center gap-2 font-bold cursor-pointer text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="refillTargetType"
                      checked={refillTargetType === "PROJECT"}
                      onChange={() => {
                        setRefillTargetType("PROJECT");
                        setSelectedFilterCustomerId("");
                        setSelectedAssignmentIds([]);
                      }}
                      className="text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    🏢 Project Wise
                  </label>

                  <label className="flex items-center gap-2 font-bold cursor-pointer text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="refillTargetType"
                      checked={refillTargetType === "CLIENT"}
                      onChange={() => {
                        setRefillTargetType("CLIENT");
                        setSelectedFilterProjectId("");
                        setSelectedAssignmentIds([]);
                      }}
                      className="text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    👤 Client / Customer Wise
                  </label>

                  <label className="flex items-center gap-2 font-bold cursor-pointer text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="refillTargetType"
                      checked={refillTargetType === "ALL"}
                      onChange={() => {
                        setRefillTargetType("ALL");
                        setSelectedFilterProjectId("");
                        setSelectedFilterCustomerId("");
                        setSelectedAssignmentIds([]);
                      }}
                      className="text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    🌐 All Active Units
                  </label>
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {refillTargetType === "PROJECT" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Select Project Site *
                    </label>
                    <select
                      value={selectedFilterProjectId}
                      onChange={(e) => {
                        setSelectedFilterProjectId(e.target.value ? Number(e.target.value) : "");
                        setSelectedAssignmentIds([]);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                    >
                      <option value="">-- All Projects --</option>
                      {uniqueProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.projectName} ({p.projectCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {refillTargetType === "CLIENT" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Select Client / Customer *
                    </label>
                    <select
                      value={selectedFilterCustomerId}
                      onChange={(e) => {
                        setSelectedFilterCustomerId(e.target.value ? Number(e.target.value) : "");
                        setSelectedAssignmentIds([]);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                    >
                      <option value="">-- All Clients --</option>
                      {uniqueCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Received / Return Date *
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  />
                </div>
              </div>

              {/* Multi-Select Checkbox Table for Active Extinguishers */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="text-amber-500" size={14} />
                    <span>Select Units to Refill ({selectedAssignmentIds.length} Selected)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search units..."
                        value={unitModalSearch}
                        onChange={(e) => setUnitModalSearch(e.target.value)}
                        className="pl-7 pr-3 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={selectAllModalAssignments}
                      className="text-[11px] font-bold text-red-600 hover:underline shrink-0"
                    >
                      {selectedAssignmentIds.length === modalActiveAssignments.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-8"></th>
                        <th className="py-2 px-3">Unit Code</th>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Origin / Site</th>
                        <th className="py-2 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {modalActiveAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                            No active fire extinguisher units found for the selected filter.
                          </td>
                        </tr>
                      ) : (
                        modalActiveAssignments.map((a) => {
                          const isSelected = selectedAssignmentIds.includes(a.id);
                          const siteName = a.project
                            ? `🏢 Project: ${a.project.projectName}`
                            : a.customer
                            ? `👤 Client: ${a.customer.companyName}`
                            : "Site";
                          return (
                            <tr
                              key={a.id}
                              onClick={() => toggleAssignmentSelection(a.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-amber-50/70 dark:bg-amber-950/30"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
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
                              <td className="py-2 px-3 font-bold text-gray-900 dark:text-gray-100 font-mono">
                                🔥 {a.fireExtinguisherUnit.unitCode}
                              </td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold">
                                {a.fireExtinguisherUnit.inventory.name}
                              </td>
                              <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-[11px]">
                                {siteName}
                              </td>
                              <td className="py-2 px-3 text-gray-500 text-[11px]">
                                {a.location || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Optional Temporary Replacement (if 1 unit selected) */}
              {selectedAssignmentIds.length === 1 && (
                <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replacementRequired}
                      onChange={(e) => setReplacementRequired(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                    />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Issue Temporary Replacement Unit for #{selectedFirstAssignment?.fireExtinguisherUnit.unitCode}?
                    </span>
                  </label>

                  {replacementRequired && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Select Available Replacement Unit from Warehouse *
                      </label>
                      <select
                        value={selectedReplacementUnitId}
                        onChange={(e) => setSelectedReplacementUnitId(Number(e.target.value))}
                        required={replacementRequired}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="">-- Select Replacement Unit --</option>
                        {compatibleReplacements.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.unitCode} ({r.inventory.name})
                          </option>
                        ))}
                      </select>
                      {compatibleReplacements.length === 0 && (
                        <div className="text-[10px] text-rose-600 mt-1 font-semibold">
                          No AVAILABLE replacement units found for this extinguisher type.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Refill Vendor Details
                </label>
                <textarea
                  rows={2}
                  placeholder="External refill supplier, pressure gauge reading..."
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || selectedAssignmentIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  {isPending ? "Processing..." : `Start Refill (${selectedAssignmentIds.length} Units)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Complete Refill Modal */}
      {isCompleteModalOpen && selectedRefillToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={18} /> Complete Refill & Re-issue Unit
              </h3>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
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

            <form onSubmit={handleCompleteRefill} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <div><strong>Refilled Physical Unit:</strong> {selectedRefillToComplete.fireExtinguisherUnit.unitCode} ({selectedRefillToComplete.fireExtinguisherUnit.inventory.name})</div>
                <div><strong>Restoring Location:</strong> {selectedRefillToComplete.assignment.project?.projectName || selectedRefillToComplete.assignment.customer?.companyName || "Original Site"}</div>
                {selectedRefillToComplete.replacementUnit && (
                  <div className="text-purple-700 dark:text-purple-300 font-semibold pt-1">
                    Temporary Replacement Unit <strong>#{selectedRefillToComplete.replacementUnit.unitCode}</strong> will be returned to Warehouse as AVAILABLE.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Completed Date *
                </label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Completion Notes / Certification Ref
                </label>
                <textarea
                  rows={2}
                  placeholder="Service tag number, hydrostatic test info..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Confirm & Restore Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
