"use client";

// ============================================================
// src/components/fire-extinguishers/AssignmentsClient.tsx
// Unified Fire Extinguisher Assignments Management UI
// ============================================================

import React, { useState, useTransition, useMemo } from "react";
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
  CheckSquare,
  Square,
} from "lucide-react";
import {
  assignFireExtinguisherAction,
  bulkAssignFireExtinguisherAction,
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
    inventory: { name: string; itemCode: string };
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

  // Target Summary Modal (Project or Client assigned items view)
  const [selectedTargetForView, setSelectedTargetForView] = useState<{
    type: "PROJECT" | "CUSTOMER";
    id: number;
    name: string;
    code?: string;
  } | null>(null);


  // Assign Form State
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [unitSearch, setUnitSearch] = useState("");
  const [targetType, setTargetType] = useState<"PROJECT" | "CUSTOMER">("PROJECT");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(projects[0]?.id || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(customers[0]?.id || "");
  const [assignLocation, setAssignLocation] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  // Return Form State
  const [returnedDate, setReturnedDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState("");

  // Filter & View Mode States
  const [viewMode, setViewMode] = useState<"GROUPED" | "UNITS">("GROUPED");
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [customerFilter, setCustomerFilter] = useState<number | "">("");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");


  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        const unitCode = a.fireExtinguisherUnit.unitCode.toLowerCase();
        const itemName = a.fireExtinguisherUnit.inventory.name.toLowerCase();
        const targetName = (a.project?.projectName || a.project?.projectCode || a.customer?.companyName || "").toLowerCase();
        const loc = (a.location || "").toLowerCase();
        const term = search.toLowerCase();

        const matchesSearch =
          unitCode.includes(term) ||
          itemName.includes(term) ||
          targetName.includes(term) ||
          loc.includes(term);

        // Tab filters
        if (activeTab === "PROJECTS" && !a.projectId) return false;
        if (activeTab === "CUSTOMERS" && !a.customerId) return false;
        if (activeTab === "ACTIVE" && a.status !== "ACTIVE") return false;
        if (activeTab === "UNDER_REFILL" && a.status !== "UNDER_REFILL") return false;
        if (activeTab === "RETURNED" && a.status !== "RETURNED" && a.status !== "COMPLETED") return false;

        // Specific Project Dropdown filter
        if (projectFilter !== "" && a.projectId !== Number(projectFilter)) return false;

        // Specific Customer Dropdown filter
        if (customerFilter !== "" && a.customerId !== Number(customerFilter)) return false;

        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.assignedDate).getTime();
        const timeB = new Date(b.assignedDate).getTime();
        return dateSort === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [assignments, search, activeTab, projectFilter, customerFilter, dateSort]);

  // Grouped by Project or Client (each project/client appears ONCE)
  const groupedTargets = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        type: "PROJECT" | "CUSTOMER";
        id: number;
        name: string;
        code?: string;
        totalUnits: number;
        activeCount: number;
        refillCount: number;
        returnedCount: number;
        latestAssignedDate: string;
        items: AssignmentItem[];
      }
    >();

    filteredAssignments.forEach((a) => {
      let key = "";
      let type: "PROJECT" | "CUSTOMER" = "PROJECT";
      let id = 0;
      let name = "";
      let code: string | undefined = undefined;

      if (a.project) {
        key = `p-${a.project.id}`;
        type = "PROJECT";
        id = a.project.id;
        name = a.project.projectName;
        code = a.project.projectCode;
      } else if (a.customer) {
        key = `c-${a.customer.id}`;
        type = "CUSTOMER";
        id = a.customer.id;
        name = a.customer.companyName;
      } else {
        key = `other-${a.id}`;
        type = "PROJECT";
        id = 0;
        name = "Unassigned / Other";
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          type,
          id,
          name,
          code,
          totalUnits: 0,
          activeCount: 0,
          refillCount: 0,
          returnedCount: 0,
          latestAssignedDate: a.assignedDate as string,
          items: [],
        });
      }

      const group = map.get(key)!;
      group.totalUnits += 1;
      if (a.status === "ACTIVE") group.activeCount += 1;
      else if (a.status === "UNDER_REFILL") group.refillCount += 1;
      else if (a.status === "RETURNED" || a.status === "COMPLETED") group.returnedCount += 1;

      if (new Date(a.assignedDate).getTime() > new Date(group.latestAssignedDate).getTime()) {
        group.latestAssignedDate = a.assignedDate as string;
      }

      group.items.push(a);
    });

    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.latestAssignedDate).getTime();
      const timeB = new Date(b.latestAssignedDate).getTime();
      return dateSort === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [filteredAssignments, dateSort]);

  // Items assigned to the target selected in View Modal
  const targetAssignments = useMemo(() => {
    if (!selectedTargetForView) return [];
    if (selectedTargetForView.type === "PROJECT") {
      return assignments.filter((a) => a.projectId === selectedTargetForView.id);
    }
    return assignments.filter((a) => a.customerId === selectedTargetForView.id);
  }, [assignments, selectedTargetForView]);

  // Summary counts
  const projectCount = useMemo(() => assignments.filter((a) => a.projectId).length, [assignments]);
  const customerCount = useMemo(() => assignments.filter((a) => a.customerId).length, [assignments]);





  // Units filtered by search inside the modal
  const filteredModalUnits = useMemo(() => {
    const term = unitSearch.toLowerCase();
    if (!term) return availableUnits;
    return availableUnits.filter(
      (u) =>
        u.unitCode.toLowerCase().includes(term) ||
        u.inventory.name.toLowerCase().includes(term) ||
        u.inventory.itemCode.toLowerCase().includes(term)
    );
  }, [availableUnits, unitSearch]);

  const toggleUnit = (id: number) =>
    setSelectedUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    const allFilteredIds = filteredModalUnits.map((u) => u.id);
    const allSelected = allFilteredIds.every((id) => selectedUnitIds.includes(id));
    if (allSelected) {
      setSelectedUnitIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedUnitIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnitIds.length === 0) {
      setErrorMsg("Please select at least one available unit.");
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
      const res = await bulkAssignFireExtinguisherAction({
        unitIds: selectedUnitIds,
        projectId: targetType === "PROJECT" ? Number(selectedProjectId) : undefined,
        customerId: targetType === "CUSTOMER" ? Number(selectedCustomerId) : undefined,
        location: assignLocation.trim() || undefined,
        notes: assignNotes.trim() || undefined,
      });

      if (res.success) {
        setIsAssignModalOpen(false);
        setSelectedUnitIds([]);
        setUnitSearch("");
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
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        
        {/* Top Row: Filter Tabs + Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto border-b sm:border-b-0 border-gray-200 dark:border-gray-800 pb-2 sm:pb-0">
            {(["ALL", "ACTIVE", "PROJECTS", "CUSTOMERS", "UNDER_REFILL", "RETURNED"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels = {
                ALL: "All",
                ACTIVE: "Active",
                PROJECTS: `Projects (${projectCount})`,
                CUSTOMERS: `Clients (${customerCount})`,
                UNDER_REFILL: "Under Refill",
                RETURNED: "Returned",
              };

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    // Reset dropdowns if switching specific tabs
                    if (tab === "PROJECTS") setCustomerFilter("");
                    if (tab === "CUSTOMERS") setProjectFilter("");
                  }}
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

        {/* Second Row: View Mode Switcher, Specific Project / Client Dropdowns & Date Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Grouped (1 Project = 1 Row) vs Detailed Unit Records */}
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode("GROUPED")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === "GROUPED"
                    ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                📁 Grouped View ({groupedTargets.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("UNITS")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === "UNITS"
                    ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                📋 All Unit Records ({filteredAssignments.length})
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500 font-bold hidden sm:flex">
              <Filter size={13} />
              <span>Filter:</span>
            </div>

            {/* Project Wise Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value ? Number(e.target.value) : "")}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              <option value="">🏢 All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.projectCode})
                </option>
              ))}
            </select>

            {/* Client / Customer Wise Filter */}
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value ? Number(e.target.value) : "")}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              <option value="">👤 All Clients ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Date Sort */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
              <Calendar size={12} /> Date:
            </span>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as "desc" | "asc")}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {(projectFilter !== "" || customerFilter !== "" || search) && (
              <button
                type="button"
                onClick={() => {
                  setProjectFilter("");
                  setCustomerFilter("");
                  setSearch("");
                }}
                className="px-2 py-1 text-[11px] font-bold text-red-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>



      {/* Assignments Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === "GROUPED" ? (
            /* ── GROUPED VIEW TABLE (1 Project / 1 Client = 1 Row) ── */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Project / Client Name</th>
                  <th className="py-3.5 px-4">Assignment Type</th>
                  <th className="py-3.5 px-4">Assigned Extinguishers</th>
                  <th className="py-3.5 px-4">Latest Assigned Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {groupedTargets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No matching projects or clients found.
                    </td>
                  </tr>
                ) : (
                  groupedTargets.map((group) => {
                    const isExpanded = expandedGroupKey === group.key;
                    const dateFormatted = new Date(group.latestAssignedDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <React.Fragment key={group.key}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          {/* Project / Client Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTargetForView({
                                    type: group.type,
                                    id: group.id,
                                    name: group.name,
                                    code: group.code,
                                  })
                                }
                                className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 text-left transition-colors group"
                              >
                                {group.type === "PROJECT" ? (
                                  <Building size={16} className="text-blue-600 shrink-0" />
                                ) : (
                                  <Box size={16} className="text-emerald-600 shrink-0" />
                                )}
                                <span className="group-hover:underline">{group.name}</span>
                              </button>

                              {group.code && (
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 rounded">
                                  {group.code}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Assignment Type */}
                          <td className="py-3.5 px-4">
                            {group.type === "PROJECT" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                                Project Site
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                Direct Client
                              </span>
                            )}
                          </td>

                          {/* Assigned Extinguishers Summary Badges */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                                🔥 {group.totalUnits} Unit{group.totalUnits !== 1 ? "s" : ""}
                              </span>
                              {group.activeCount > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  {group.activeCount} Active
                                </span>
                              )}
                              {group.refillCount > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  {group.refillCount} Under Refill
                                </span>
                              )}
                              {group.returnedCount > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  {group.returnedCount} Returned
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Latest Assigned Date */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-mono font-medium">
                              <Calendar size={13} className="text-gray-400 shrink-0" />
                              <span>{dateFormatted}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Open items modal */}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTargetForView({
                                    type: group.type,
                                    id: group.id,
                                    name: group.name,
                                    code: group.code,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                              >
                                <Eye size={13} /> View Items ({group.totalUnits})
                              </button>

                              {/* Expand inline drawer */}
                              <button
                                type="button"
                                onClick={() => setExpandedGroupKey(isExpanded ? null : group.key)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                              >
                                {isExpanded ? "▲ Collapse" : "▼ Expand Items"}
                              </button>

                              {group.type === "PROJECT" && (
                                <Link
                                  href={`/projects/${group.id}`}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  Project Page →
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Inline Expandable Drawer showing items */}
                        {isExpanded && (
                          <tr className="bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                            <td colSpan={5} className="p-4">
                              <div className="space-y-3 bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-inner">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Flame size={14} className="text-red-600" />
                                    <span>Assigned Fire Extinguisher Units for {group.name}</span>
                                  </span>
                                  {canAssign && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (group.type === "PROJECT") {
                                          setTargetType("PROJECT");
                                          setSelectedProjectId(group.id);
                                        } else {
                                          setTargetType("CUSTOMER");
                                          setSelectedCustomerId(group.id);
                                        }
                                        setIsAssignModalOpen(true);
                                      }}
                                      className="text-xs font-bold text-red-600 hover:underline"
                                    >
                                      + Assign More Units Here
                                    </button>
                                  )}
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                                        <th className="py-2 px-3">Unit Code</th>
                                        <th className="py-2 px-3">Item Description</th>
                                        <th className="py-2 px-3">Serial No</th>
                                        <th className="py-2 px-3">Location</th>
                                        <th className="py-2 px-3">Assigned Date</th>
                                        <th className="py-2 px-3">Status</th>
                                        <th className="py-2 px-3 text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {group.items.map((item) => {
                                        const badge = STATUS_BADGES[item.status] || STATUS_BADGES.ACTIVE;
                                        return (
                                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                            <td className="py-2 px-3 font-bold font-mono text-gray-900 dark:text-gray-100">
                                              🔥 {item.fireExtinguisherUnit.unitCode}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                              {item.fireExtinguisherUnit.inventory.name}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-gray-500">
                                              {item.fireExtinguisherUnit.serialNumber || "—"}
                                            </td>
                                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                                              {item.location || "—"}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-gray-500">
                                              {new Date(item.assignedDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 px-3">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <Link
                                                href={`/fire-extinguishers/${encodeURIComponent(item.fireExtinguisherUnit.unitCode)}`}
                                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                                              >
                                                View Unit →
                                              </Link>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* ── ALL UNIT RECORDS TABLE ── */
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
                    const isProject = Boolean(a.project);
                    const isCustomer = Boolean(a.customer);

                    const assignedFormattedDate = new Date(a.assignedDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Flame size={14} className="text-red-600" />
                          <span className="font-mono">{a.fireExtinguisherUnit.unitCode}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                          {a.fireExtinguisherUnit.inventory.name}
                          <div className="text-[10px] text-gray-400 font-normal font-mono">
                            {a.fireExtinguisherUnit.inventory.itemCode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isProject && a.project ? (
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTargetForView({
                                    type: "PROJECT",
                                    id: a.project!.id,
                                    name: a.project!.projectName,
                                    code: a.project!.projectCode,
                                  })
                                }
                                className="font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-left flex items-center gap-1.5 transition-colors group"
                                title="Click to view all items assigned to this project"
                              >
                                <Building size={13} className="text-blue-600 shrink-0" />
                                <span className="group-hover:underline">{a.project.projectName}</span>
                              </button>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>{a.project.projectCode}</span>
                                <Link
                                  href={`/projects/${a.project.id}`}
                                  className="text-blue-600 hover:underline font-sans text-[10px]"
                                >
                                  Project Page →
                                </Link>
                              </div>
                            </div>
                          ) : isCustomer && a.customer ? (
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTargetForView({
                                    type: "CUSTOMER",
                                    id: a.customer!.id,
                                    name: a.customer!.companyName,
                                  })
                                }
                                className="font-bold text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 text-left flex items-center gap-1.5 transition-colors group"
                                title="Click to view all items assigned to this client"
                              >
                                <Box size={13} className="text-emerald-600 shrink-0" />
                                <span className="group-hover:underline">{a.customer.companyName}</span>
                              </button>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Direct Client
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {isProject ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              Project Site
                            </span>
                          ) : isCustomer ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              Direct Client
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                              Other
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {a.location || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-semibold font-mono text-xs">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>{assignedFormattedDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Target assigned items modal view */}
                            {(a.project || a.customer) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (a.project) {
                                    setSelectedTargetForView({
                                      type: "PROJECT",
                                      id: a.project.id,
                                      name: a.project.projectName,
                                      code: a.project.projectCode,
                                    });
                                  } else if (a.customer) {
                                    setSelectedTargetForView({
                                      type: "CUSTOMER",
                                      id: a.customer.id,
                                      name: a.customer.companyName,
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
                                title="View all extinguishers assigned to this project/client"
                              >
                                <Building size={13} /> Target Items
                              </button>
                            )}

                            <Link
                              href={`/fire-extinguishers/${encodeURIComponent(a.fireExtinguisherUnit.unitCode)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Eye size={13} /> Unit
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
          )}
        </div>
      </div>


      {/* Direct Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Plus className="text-red-600" size={18} /> Direct Fire Extinguisher Assignment
                {selectedUnitIds.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full">
                    {selectedUnitIds.length} selected
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAssignModalOpen(false); setSelectedUnitIds([]); setUnitSearch(""); }}
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

              {/* Unit Multi-Select Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Select Available Physical Units *
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    {filteredModalUnits.length > 0 && filteredModalUnits.every((u) => selectedUnitIds.includes(u.id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                {/* Search within units */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search unit code, item name..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
                  {availableUnits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      No AVAILABLE units found. Register new physical units first.
                    </div>
                  ) : filteredModalUnits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      No units match your search.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase sticky top-0 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="py-2 px-3 w-8"></th>
                          <th className="py-2 px-3">Unit Code</th>
                          <th className="py-2 px-3">Item Description</th>
                          <th className="py-2 px-3">Item Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredModalUnits.map((u) => {
                          const isSelected = selectedUnitIds.includes(u.id);
                          return (
                            <tr
                              key={u.id}
                              onClick={() => toggleUnit(u.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-red-50 dark:bg-red-950/30"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                {isSelected ? (
                                  <CheckSquare size={14} className="text-red-600" />
                                ) : (
                                  <Square size={14} className="text-gray-400" />
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-gray-100 font-mono">
                                {u.unitCode}
                              </td>
                              <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                                {u.inventory.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-400">
                                {u.inventory.itemCode}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {selectedUnitIds.length > 0 && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    ✓ {selectedUnitIds.length} unit{selectedUnitIds.length > 1 ? "s" : ""} selected for assignment
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
                  onClick={() => { setIsAssignModalOpen(false); setSelectedUnitIds([]); setUnitSearch(""); }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || selectedUnitIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending
                    ? `Assigning ${selectedUnitIds.length} unit(s)…`
                    : selectedUnitIds.length === 0
                    ? "Select Units First"
                    : `Confirm Assignment (${selectedUnitIds.length} Unit${selectedUnitIds.length > 1 ? "s" : ""})`}
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
      {/* Target Assigned Items Modal (Project / Client View) */}
      {selectedTargetForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  {selectedTargetForView.type === "PROJECT" ? <Building size={20} /> : <Box size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {selectedTargetForView.name}
                    </h3>
                    {selectedTargetForView.code && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 rounded">
                        {selectedTargetForView.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedTargetForView.type === "PROJECT" ? "Project Site Extinguisher Inventory" : "Direct Client Extinguisher Inventory"} — {targetAssignments.length} Assigned Unit(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTargetForView.type === "PROJECT" && (
                  <Link
                    href={`/projects/${selectedTargetForView.id}`}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 rounded-lg transition-colors"
                  >
                    Open Project Page →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTargetForView(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Summary Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Units</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{targetAssignments.length}</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active Units</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {targetAssignments.filter((a) => a.status === "ACTIVE").length}
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Under Refill</div>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {targetAssignments.filter((a) => a.status === "UNDER_REFILL").length}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Returned / History</div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {targetAssignments.filter((a) => a.status === "RETURNED" || a.status === "COMPLETED").length}
                </div>
              </div>
            </div>

            {/* Target Items Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2.5 px-3">Unit Code</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Serial No</th>
                      <th className="py-2.5 px-3">Specific Location</th>
                      <th className="py-2.5 px-3">Assigned Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {targetAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No fire extinguisher units assigned to this target.
                        </td>
                      </tr>
                    ) : (
                      targetAssignments.map((a) => {
                        const badge = STATUS_BADGES[a.status] || STATUS_BADGES.ACTIVE;
                        return (
                          <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold font-mono text-gray-900 dark:text-gray-100">
                              🔥 {a.fireExtinguisherUnit.unitCode}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200">
                              {a.fireExtinguisherUnit.inventory.name}
                              <div className="text-[10px] text-gray-400 font-mono">
                                {a.fireExtinguisherUnit.inventory.itemCode}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-gray-500">
                              {a.fireExtinguisherUnit.serialNumber || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                              {a.location || "—"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                              {new Date(a.assignedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/fire-extinguishers/${encodeURIComponent(a.fireExtinguisherUnit.unitCode)}`}
                                  className="px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded transition-colors"
                                >
                                  View History
                                </Link>
                                {a.status === "ACTIVE" && canReturn && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTargetForView(null);
                                      setSelectedAssignmentToReturn(a);
                                      setIsReturnModalOpen(true);
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded transition-colors"
                                  >
                                    Return
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

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTargetForView(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

