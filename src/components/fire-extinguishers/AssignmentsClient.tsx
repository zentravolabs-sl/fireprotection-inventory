"use client";

// ============================================================
// src/components/fire-extinguishers/AssignmentsClient.tsx
// Unified Fire Extinguisher Assignments Management UI
// ============================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Flame,
  Search,
  Plus,
  RefreshCw,
  RotateCcw,
  Eye,
  Building,
  Box,
  Calendar,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import {
  assignFireExtinguisherAction,
  returnFireExtinguisherAction,
} from "@/app/actions/fire-extinguishers";
import type { FireExtinguisherAssignmentStatus } from "@/generated/prisma/client";

interface AssignmentItem {
  id: number;
  fireExtinguisherUnitId: number;
  projectId: number | null;
  customerId: number | null;
  assignedDate: Date | string;
  location: string | null;
  status: FireExtinguisherAssignmentStatus;
  returnedDate: Date | string | null;
  notes: string | null;
  fireExtinguisherUnit: {
    unitCode: string;
    serialNumber: string | null;
    inventory: { name: string; itemCode: string; unit: string };
  };
  project: { id: number; projectName: string; projectCode: string } | null;
  customer: { id: number; companyName: string } | null;
}

interface ProjectOption {
  id: number;
  projectCode: string;
  projectName: string;
}

interface CustomerOption {
  id: number;
  companyName: string;
}

interface AvailableUnitOption {
  id: number;
  unitCode: string;
  inventory: { name: string; itemCode: string };
}

interface AssignmentsClientProps {
  initialAssignments: AssignmentItem[];
  projects: ProjectOption[];
  customers: CustomerOption[];
  availableUnits: AvailableUnitOption[];
  canAssign: boolean;
  canReturn: boolean;
}

const STATUS_BADGES: Record<FireExtinguisherAssignmentStatus, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300", text: "text-emerald-800 dark:text-emerald-300" },
  UNDER_REFILL: { label: "Under Refill", bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300", text: "text-amber-800 dark:text-amber-300" },
  RETURNED: { label: "Returned", bg: "bg-gray-100 dark:bg-gray-800 border-gray-300", text: "text-gray-700 dark:text-gray-300" },
  REPLACED: { label: "Replaced", bg: "bg-purple-100 dark:bg-purple-950/60 border-purple-300", text: "text-purple-800 dark:text-purple-300" },
  COMPLETED: { label: "Completed", bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300", text: "text-blue-800 dark:text-blue-300" },
};

export function AssignmentsClient({
  initialAssignments,
  projects,
  customers,
  availableUnits,
  canAssign,
  canReturn,
}: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [activeTab, setActiveTab] = useState<"ALL" | "PROJECTS" | "CUSTOMERS" | "ACTIVE" | "UNDER_REFILL" | "RETURNED">("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAssignmentToReturn, setSelectedAssignmentToReturn] = useState<AssignmentItem | null>(null);

  // Assign Form State
  const [selectedUnitId, setSelectedUnitId] = useState<number | "">(availableUnits[0]?.id || "");
  const [targetType, setTargetType] = useState<"PROJECT" | "CUSTOMER">("PROJECT");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(projects[0]?.id || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(customers[0]?.id || "");
  const [assignLocation, setAssignLocation] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  // Return Form State
  const [returnedDate, setReturnedDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState("");

  const filteredAssignments = assignments.filter((a) => {
    const unitCode = a.fireExtinguisherUnit.unitCode.toLowerCase();
    const itemName = a.fireExtinguisherUnit.inventory.name.toLowerCase();
    const targetName = (a.project?.projectName || a.customer?.companyName || "").toLowerCase();
    const loc = (a.location || "").toLowerCase();
    const term = search.toLowerCase();

    const matchesSearch = unitCode.includes(term) || itemName.includes(term) || targetName.includes(term) || loc.includes(term);

    if (activeTab === "PROJECTS") return matchesSearch && Boolean(a.projectId);
    if (activeTab === "CUSTOMERS") return matchesSearch && Boolean(a.customerId);
    if (activeTab === "ACTIVE") return matchesSearch && a.status === "ACTIVE";
    if (activeTab === "UNDER_REFILL") return matchesSearch && a.status === "UNDER_REFILL";
    if (activeTab === "RETURNED") return matchesSearch && (a.status === "RETURNED" || a.status === "COMPLETED");

    return matchesSearch;
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setErrorMsg("Please select an available physical unit.");
      return;
    }

    if (targetType === "PROJECT" && !selectedProjectId) {
      setErrorMsg("Please select a project.");
      return;
    }

    if (targetType === "CUSTOMER" && !selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await assignFireExtinguisherAction({
        unitId: Number(selectedUnitId),
        projectId: targetType === "PROJECT" ? Number(selectedProjectId) : undefined,
        customerId: targetType === "CUSTOMER" ? Number(selectedCustomerId) : undefined,
        location: assignLocation.trim() || undefined,
        notes: assignNotes.trim() || undefined,
      });

      if (res.success) {
        setIsAssignModalOpen(false);
        setAssignLocation("");
        setAssignNotes("");
        window.location.reload();
      } else {
        setErrorMsg(res.message || "Failed to create assignment.");
      }
    });
  };

  const handleReturnUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentToReturn) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await returnFireExtinguisherAction({
        assignmentId: selectedAssignmentToReturn.id,
        returnedDate,
        notes: returnNotes.trim() || undefined,
      });

      if (res.success) {
        setIsReturnModalOpen(false);
        setSelectedAssignmentToReturn(null);
        setReturnNotes("");
        window.location.reload();
      } else {
        setErrorMsg(res.message || "Failed to return unit.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto border-b sm:border-b-0 border-gray-200 dark:border-gray-800 pb-2 sm:pb-0">
          {(["ALL", "ACTIVE", "PROJECTS", "CUSTOMERS", "UNDER_REFILL", "RETURNED"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              ALL: "All",
              ACTIVE: "Active",
              PROJECTS: "Projects",
              CUSTOMERS: "Customers",
              UNDER_REFILL: "Under Refill",
              RETURNED: "Returned",
            };

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
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
              placeholder="Search Unit, Project, Client, Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {canAssign && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <Plus size={15} /> Direct Assign
            </button>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Unit Code</th>
                <th className="py-3.5 px-4">Item Description</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Assignment Type</th>
                <th className="py-3.5 px-4">Specific Location</th>
                <th className="py-3.5 px-4">Assigned Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No fire extinguisher assignments found.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => {
                  const badge = STATUS_BADGES[a.status] || STATUS_BADGES.ACTIVE;
                  const targetLabel = a.project
                    ? a.project.projectName
                    : a.customer
                    ? a.customer.companyName
                    : "Unassigned";

                  const targetTypeLabel = a.project ? "Project Site" : a.customer ? "Direct Client" : "Other";

                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Flame size={14} className="text-red-600" />
                        <span>{a.fireExtinguisherUnit.unitCode}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {a.fireExtinguisherUnit.inventory.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                        {targetLabel}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          {targetTypeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {a.location || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(a.assignedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/fire-extinguishers/${encodeURIComponent(a.fireExtinguisherUnit.unitCode)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Eye size={13} /> View
                          </Link>

                          {a.status === "ACTIVE" && canReturn && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignmentToReturn(a);
                                setIsReturnModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-700"
                            >
                              <RotateCcw size={13} /> Return
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

      {/* Direct Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Plus className="text-red-600" size={18} /> Direct Fire Extinguisher Assignment
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
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

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Select Available Physical Unit *
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitCode} ({u.inventory.name})
                    </option>
                  ))}
                </select>
                {availableUnits.length === 0 && (
                  <div className="text-[11px] text-rose-600 font-semibold mt-1">
                    No AVAILABLE units found in warehouse. Register new physical units first.
                  </div>
                )}
              </div>

              {/* Assignment Target Switcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Assign To *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "PROJECT"}
                      onChange={() => setTargetType("PROJECT")}
                      className="text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    Project Site
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "CUSTOMER"}
                      onChange={() => setTargetType("CUSTOMER")}
                      className="text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    Direct Client / Customer
                  </label>
                </div>
              </div>

              {targetType === "PROJECT" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Select Project *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} ({p.projectCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Select Customer / Client *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
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
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Specific Location on Site / Building Floor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Building Floor 2, Server Room..."
                  value={assignLocation}
                  onChange={(e) => setAssignLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional assignment notes..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Unit Modal */}
      {isReturnModalOpen && selectedAssignmentToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <RotateCcw className="text-gray-700 dark:text-gray-200" size={18} /> Return Extinguisher to Warehouse
              </h3>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
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

            <form onSubmit={handleReturnUnit} className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                <div><strong>Returning Physical Unit:</strong> {selectedAssignmentToReturn.fireExtinguisherUnit.unitCode} ({selectedAssignmentToReturn.fireExtinguisherUnit.inventory.name})</div>
                <div><strong>Returning From:</strong> {selectedAssignmentToReturn.project?.projectName || selectedAssignmentToReturn.customer?.companyName || "Site"}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Returned Date *
                </label>
                <input
                  type="date"
                  value={returnedDate}
                  onChange={(e) => setReturnedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Return Condition / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Unit condition on return, pressure gauge check..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-gray-900 dark:bg-gray-100 text-gray-900 dark:text-gray-900 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Confirm Return to Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
