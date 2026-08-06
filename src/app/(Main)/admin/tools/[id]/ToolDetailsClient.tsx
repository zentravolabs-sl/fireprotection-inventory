"use client";

// ============================================================
// src/app/(Main)/admin/tools/[id]/ToolDetailsClient.tsx
// Tool detail view with current status, assignment info, and history tabs.
// ============================================================

import React, { useState } from "react";
import { Image as ImageIcon, Wrench, Calendar, Hash, Barcode } from "lucide-react";

interface HistoryEntry {
  id: number;
  action: string;
  remarks: string | null;
  createdAt: Date;
  project: { id: number; projectCode: string; projectName: string } | null;
  createdByUser: { id: string; name: string };
}

interface AssignmentItemEntry {
  id: number;
  conditionAtIssue: string;
  returnedAt: Date | null;
  returnCondition: string | null;
  remarks: string | null;
  toolAssignment: {
    id: number;
    assignmentNo: string;
    assignDate: Date;
    expectedReturnDate: Date | null;
    status: string;
    project: { id: number; projectCode: string; projectName: string } | null;
    engineer: { id: string; name: string } | null;
  };
}

interface ToolDetail {
  id: number;
  toolCode: string;
  name: string;
  serialNo: string;
  condition: string;
  status: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignmentItems: AssignmentItemEntry[];
  histories: HistoryEntry[];
}

interface ToolDetailsClientProps {
  tool: ToolDetail;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Available": return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "InUse": return "bg-blue-950/60 text-blue-400 border-blue-800/60";
    case "Maintenance": return "bg-orange-950/60 text-orange-400 border-orange-800/60";
    case "Lost": return "bg-red-950/60 text-red-400 border-red-800/60";
    case "Retired": return "bg-gray-900/60 text-gray-400 border-gray-700/60";
    default: return "bg-gray-900/60 text-gray-400 border-gray-700/60";
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case "ASSIGNED": return "bg-blue-950/60 text-blue-400 border-blue-800/60";
    case "RETURNED": return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "REPAIR": return "bg-orange-950/60 text-orange-400 border-orange-800/60";
    case "LOST": return "bg-red-950/60 text-red-400 border-red-800/60";
    case "RETIRED": return "bg-gray-900/60 text-gray-400 border-gray-700/60";
    default: return "bg-gray-900/60 text-gray-400 border-gray-700/60";
  }
}

type Tab = "assignments" | "repairs" | "history";

export function ToolDetailsClient({ tool }: ToolDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("assignments");

  const currentItem = tool.assignmentItems.find((i) => i.returnedAt === null);
  const repairHistory = tool.histories.filter((h) => h.action === "REPAIR");
  const lostHistory = tool.histories.filter((h) => h.action === "LOST");

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="flex-shrink-0">
            {tool.imageUrl ? (
              <img
                src={tool.imageUrl}
                alt={tool.name}
                className="w-28 h-28 rounded-xl object-cover border border-[#1e2a3d]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/112x112?text=NA";
                }}
              />
            ) : (
              <div className="w-28 h-28 rounded-xl bg-[#161d2e] border border-[#1e2a3d] flex items-center justify-center">
                <ImageIcon size={32} className="text-[#3d4c62]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-2xl font-black text-[#dce3ef]">{tool.name}</h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getStatusBadge(tool.status)}`}>
                {tool.status === "InUse" ? "In Use" : tool.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-[#3d4c62] uppercase tracking-wide">Tool Code</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Barcode size={13} className="text-[#e02424]" />
                  <span className="font-mono font-bold text-[#e02424] text-sm">{tool.toolCode}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#3d4c62] uppercase tracking-wide">Serial Number</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Hash size={13} className="text-[#5a657a]" />
                  <span className="font-mono text-[#dce3ef] text-sm">{tool.serialNo}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#3d4c62] uppercase tracking-wide">Condition</p>
                <p className="font-semibold text-[#dce3ef] text-sm mt-1">{tool.condition}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#3d4c62] uppercase tracking-wide">Repair Count</p>
                <p className="font-bold text-orange-400 text-sm mt-1">
                  {repairHistory.length + lostHistory.length} event(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#3d4c62]" />
              <span className="text-xs text-[#5a657a]">Added: {formatDate(tool.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Assignment Card */}
      {currentItem && (
        <div className="bg-blue-950/20 border border-blue-800/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            <Wrench size={15} />
            Currently Assigned
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[#3d4c62] font-semibold uppercase tracking-wide mb-0.5">Project</p>
              <p className="text-[#dce3ef] font-bold">{currentItem.toolAssignment.project?.projectCode || "—"}</p>
              <p className="text-[#5a657a] text-[11px]">{currentItem.toolAssignment.project?.projectName}</p>
            </div>
            <div>
              <p className="text-[#3d4c62] font-semibold uppercase tracking-wide mb-0.5">Engineer</p>
              <p className="text-[#dce3ef] font-semibold">{currentItem.toolAssignment.engineer?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[#3d4c62] font-semibold uppercase tracking-wide mb-0.5">Assign Date</p>
              <p className="text-[#dce3ef]">{formatDate(currentItem.toolAssignment.assignDate)}</p>
            </div>
            <div>
              <p className="text-[#3d4c62] font-semibold uppercase tracking-wide mb-0.5">Expected Return</p>
              <p className={`font-semibold ${
                currentItem.toolAssignment.expectedReturnDate &&
                new Date(currentItem.toolAssignment.expectedReturnDate) < new Date()
                  ? "text-red-400"
                  : "text-[#dce3ef]"
              }`}>
                {formatDate(currentItem.toolAssignment.expectedReturnDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Tabs */}
      <div>
        <div className="flex gap-1 border-b border-[#1e2a3d] overflow-x-auto">
          {([
            { id: "assignments", label: `📋 Assignment History (${tool.assignmentItems.length})` },
            { id: "repairs", label: `🔧 Repair / Lost (${repairHistory.length + lostHistory.length})` },
            { id: "history", label: `⏱ All Events (${tool.histories.length})` },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-[#e02424] text-[#e02424]"
                  : "border-transparent text-[#5a657a] hover:text-[#dce3ef]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* Assignment History Tab */}
          {activeTab === "assignments" && (
            <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Assignment No</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Project</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Engineer</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Assigned</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Returned</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Condition at Return</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3d]">
                    {tool.assignmentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-[#5a657a]">
                          No assignment history for this tool.
                        </td>
                      </tr>
                    ) : (
                      tool.assignmentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#161d2e] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#e02424]">
                            {item.toolAssignment.assignmentNo}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] font-bold text-[#5a657a]">
                              {item.toolAssignment.project?.projectCode}
                            </div>
                            <div className="text-[#dce3ef] font-medium text-[11px]">
                              {item.toolAssignment.project?.projectName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#dce3ef]">
                            {item.toolAssignment.engineer?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#5a657a]">
                            {formatDate(item.toolAssignment.assignDate)}
                          </td>
                          <td className="px-4 py-3 text-[#5a657a]">
                            {item.returnedAt ? formatDate(item.returnedAt) : <span className="text-blue-400">Not returned</span>}
                          </td>
                          <td className="px-4 py-3">
                            {item.returnCondition ? (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                item.returnCondition === "Good"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                                  : "bg-orange-950/60 text-orange-400 border-orange-800/60"
                              }`}>
                                {item.returnCondition}
                              </span>
                            ) : <span className="text-[#3d4c62]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(item.toolAssignment.status === "ACTIVE" ? "InUse" : "Available")}`}>
                              {item.toolAssignment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Repair/Lost Tab */}
          {activeTab === "repairs" && (
            <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Project</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Logged By</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Remarks</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3d]">
                    {repairHistory.length + lostHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-[#5a657a]">
                          No repair or lost events recorded for this tool.
                        </td>
                      </tr>
                    ) : (
                      [...repairHistory, ...lostHistory]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((h) => (
                          <tr key={h.id} className="hover:bg-[#161d2e] transition-colors">
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getActionBadge(h.action)}`}>
                                {h.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-[11px] font-bold text-[#5a657a]">
                                {h.project?.projectCode || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#dce3ef]">{h.createdByUser.name}</td>
                            <td className="px-4 py-3 text-[#5a657a] max-w-[200px] truncate">
                              {h.remarks || "—"}
                            </td>
                            <td className="px-4 py-3 text-[#5a657a]">{formatDateTime(h.createdAt)}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All History Tab */}
          {activeTab === "history" && (
            <div className="bg-[#0d1117] rounded-2xl border border-[#1e2a3d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#080c12] border-b border-[#1e2a3d]">
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Action</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Project</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Logged By</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Remarks</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#3d4c62] uppercase tracking-wide">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3d]">
                    {tool.histories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-[#5a657a]">
                          No history events yet.
                        </td>
                      </tr>
                    ) : (
                      tool.histories.map((h) => (
                        <tr key={h.id} className="hover:bg-[#161d2e] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getActionBadge(h.action)}`}>
                              {h.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] text-[#5a657a]">
                              {h.project?.projectCode || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#dce3ef]">{h.createdByUser.name}</td>
                          <td className="px-4 py-3 text-[#5a657a] max-w-[200px] truncate">
                            {h.remarks || "—"}
                          </td>
                          <td className="px-4 py-3 text-[#5a657a]">{formatDateTime(h.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolDetailsClient;
