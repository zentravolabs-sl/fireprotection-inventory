"use client";

// ============================================================
// src/components/tools/AssignedToolsTab.tsx
// Tab content for the Project Details page showing all assigned tools.
// ============================================================

import React, { useState } from "react";
import { AssignToolModal } from "./AssignToolModal";
import { ReturnToolModal } from "./ReturnToolModal";
import { Wrench, Image as ImageIcon, RotateCcw, Plus } from "lucide-react";

interface Engineer {
  id: string;
  name: string;
  email: string;
}

interface AssignedToolItem {
  id: number;
  toolId: number;
  conditionAtIssue: string;
  returnedAt: Date | null;
  returnCondition: string | null;
  remarks: string | null;
  tool: {
    id: number;
    toolCode: string;
    name: string;
    serialNo: string;
    condition: string;
    status: string;
    imageUrl: string | null;
  };
}

interface ToolAssignment {
  id: number;
  assignmentNo: string;
  assignDate: Date;
  expectedReturnDate: Date | null;
  status: string;
  engineer: { id: string; name: string; email: string };
  items: AssignedToolItem[];
}

interface AssignedToolsTabProps {
  projectId: number;
  projectName: string;
  engineers: Engineer[];
  toolAssignments: ToolAssignment[];
  isSuperAdmin?: boolean;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Available":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "InUse":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    case "Maintenance":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300";
    case "Lost":
      return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusLabel(status: string) {
  if (status === "InUse") return "In Use";
  return status;
}

function getAssignmentStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    case "PARTIALLY_RETURNED": return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    case "RETURNED": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "CANCELLED": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

export function AssignedToolsTab({
  projectId,
  projectName,
  engineers,
  toolAssignments,
  isSuperAdmin = false,
}: AssignedToolsTabProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<AssignedToolItem | null>(null);

  // Flatten items for stats
  const allItems = (toolAssignments || []).flatMap((a) => a?.items || []);
  const totalAssigned = allItems.length;
  const currentlyInUse = allItems.filter((i) => i.returnedAt === null).length;
  const returned = allItems.filter((i) => i.returnedAt !== null && i.returnCondition !== "Damaged" && i.returnCondition !== null).length;
  const underRepair = allItems.filter(
    (i) => i.returnedAt !== null && i.returnCondition === "Damaged"
  ).length;
  const lost = (toolAssignments || []).reduce(
    (acc, a) => acc + (a?.items || []).filter((i) => i?.tool?.status === "Lost" && i?.returnedAt !== null).length,
    0
  );

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <Wrench size={16} className="text-red-600" />
            Assigned Tools
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Tools currently assigned to this project and their return status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setIsAssignOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus size={13} />
              Assign Tool
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Assigned", value: totalAssigned, color: "text-gray-900 dark:text-gray-100", bg: "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700" },
          { label: "Currently In Use", value: currentlyInUse, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900" },
          { label: "Returned", value: returned, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" },
          { label: "Under Repair", value: underRepair, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900" },
          { label: "Lost", value: lost, color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" },
        ].map((stat) => (
          <div key={stat.label} className={`p-3 rounded-lg border ${stat.bg}`}>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tool Assignments */}
      {toolAssignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center">
          <Wrench size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm font-medium">No tools assigned to this project yet.</p>
          <p className="text-gray-400 text-xs mt-1">Click "Assign Tool" to get started.</p>
        </div>
      ) : (
        toolAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
          >
            {/* Assignment Header */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                  {assignment.assignmentNo}
                </span>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${getAssignmentStatusBadge(assignment.status)}`}>
                  {assignment.status.replace("_", " ")}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-3">
                <span>Engineer: <strong className="text-gray-700 dark:text-gray-300">{assignment.engineer.name}</strong></span>
                <span>Assigned: <strong>{formatDate(assignment.assignDate)}</strong></span>
                {assignment.expectedReturnDate && (
                  <span>
                    Expected Return:{" "}
                    <strong className={new Date(assignment.expectedReturnDate) < new Date() && assignment.status === "ACTIVE" ? "text-red-600" : ""}>
                      {formatDate(assignment.expectedReturnDate)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Tools Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50/50 dark:bg-gray-800/30 uppercase text-[11px] font-semibold text-gray-400">
                  <tr>
                    <th className="px-4 py-2.5 w-10">Img</th>
                    <th className="px-4 py-2.5">Tool Code</th>
                    <th className="px-4 py-2.5">Tool Name</th>
                    <th className="px-4 py-2.5">Serial Number</th>
                    <th className="px-4 py-2.5">Condition at Issue</th>
                    <th className="px-4 py-2.5">Return Condition</th>
                    <th className="px-4 py-2.5">Returned At</th>
                    <th className="px-4 py-2.5">Current Status</th>
                    {isSuperAdmin && <th className="px-4 py-2.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {assignment.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        {item.tool.imageUrl ? (
                          <img
                            src={item.tool.imageUrl}
                            alt={item.tool.name}
                            className="w-8 h-8 rounded-md object-cover border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/32x32?text=NA";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <ImageIcon size={12} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400">
                        {item.tool.toolCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {item.tool.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">
                        {item.tool.serialNo}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-[11px] font-semibold">
                          {item.conditionAtIssue}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.returnCondition ? (
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${item.returnCondition === "Good"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                            {item.returnCondition}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.returnedAt ? formatDate(item.returnedAt) : <span className="text-gray-400">Not returned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getStatusBadge(item.tool.status)}`}>
                          {getStatusLabel(item.tool.status)}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          {!item.returnedAt && (
                            <button
                              onClick={() => setReturnTarget(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-300 rounded-md transition-colors border border-orange-200 dark:border-orange-800"
                            >
                              <RotateCcw size={11} />
                              Return
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Assign Tool Modal */}
      {isAssignOpen && (
        <AssignToolModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          projectId={projectId}
          projectName={projectName}
          engineers={engineers}
        />
      )}

      {/* Return Tool Modal */}
      {returnTarget && (
        <ReturnToolModal
          isOpen={Boolean(returnTarget)}
          onClose={() => setReturnTarget(null)}
          item={{
            id: returnTarget.id,
            toolName: returnTarget.tool.name,
            toolCode: returnTarget.tool.toolCode,
            serialNo: returnTarget.tool.serialNo,
            conditionAtIssue: returnTarget.conditionAtIssue,
          }}
        />
      )}
    </div>
  );
}

export default AssignedToolsTab;
