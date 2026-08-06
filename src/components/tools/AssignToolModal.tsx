"use client";

// ============================================================
// src/components/tools/AssignToolModal.tsx
// Modal to assign multiple available tools to a project.
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { assignToolsAction, getAvailableToolsAction } from "@/app/actions/tool-assignments";
import { Search, Wrench, Image as ImageIcon } from "lucide-react";

interface Engineer {
  id: string;
  name: string;
  email: string;
}

interface AvailableTool {
  id: number;
  toolCode: string;
  name: string;
  serialNo: string;
  condition: string;
  status: string;
  imageUrl: string | null;
}

interface AssignToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  engineers: Engineer[];
}

function getConditionColor(condition: string) {
  switch (condition) {
    case "New": return "bg-emerald-100 text-emerald-800";
    case "Good": return "bg-blue-100 text-blue-800";
    case "Fair": return "bg-amber-100 text-amber-800";
    case "Damaged": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function AssignToolModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  engineers,
}: AssignToolModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<AvailableTool[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [engineerId, setEngineerId] = useState(engineers[0]?.id ?? "");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedReturn, setExpectedReturn] = useState("");
  const [remarks, setRemarks] = useState("");

  // Fetch available tools when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    setSelectedIds(new Set());
    setSearch("");
    setError(null);
    getAvailableToolsAction().then((res) => {
      setTools(res.tools as AvailableTool[]);
      setFetching(false);
    });
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.toolCode.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q)
    );
  }, [tools, search]);

  function toggleTool(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("Please select at least one tool.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("projectId", projectId.toString());
    formData.set("engineerId", engineerId);
    formData.set("assignDate", assignDate);
    formData.set("expectedReturnDate", expectedReturn);
    formData.set("remarks", remarks);
    selectedIds.forEach((id) => formData.append("toolIds", id.toString()));

    const res = await assignToolsAction(formData);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔧 Assign Tools to Project" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Project (readonly) + Engineer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Project
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium">
              {projectName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Assign To Engineer *
            </label>
            <select
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {engineers.length === 0 && (
                <option value="">No engineers assigned to project</option>
              )}
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates + Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Assign Date *
            </label>
            <input
              type="date"
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Expected Return Date
            </label>
            <input
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Optional remarks..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        {/* Available Tools Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Available Tools{" "}
              {selectedIds.size > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[11px]">
                  {selectedIds.size} selected
                </span>
              )}
            </label>
            {/* Search */}
            <div className="relative w-52">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {fetching ? (
              <div className="p-6 text-center text-sm text-gray-500">
                <Wrench size={20} className="mx-auto mb-2 animate-pulse text-gray-300" />
                Loading available tools...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                {tools.length === 0
                  ? "No available tools found. All tools are currently in use or under repair."
                  : "No tools match your search."}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide w-10">Img</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Tool Code</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Tool Name</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Serial No</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((tool) => (
                    <tr
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedIds.has(tool.id)
                          ? "bg-red-50 dark:bg-red-950/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(tool.id)}
                          onChange={() => toggleTool(tool.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        {tool.imageUrl ? (
                          <img
                            src={tool.imageUrl}
                            alt={tool.name}
                            className="w-8 h-8 rounded-md object-cover border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/32x32?text=NA";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <ImageIcon size={12} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {tool.toolCode}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                        {tool.name}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-500">
                        {tool.serialNo}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getConditionColor(tool.condition)}`}>
                          {tool.condition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Cancel
          </button>
          <FormButton
            loading={loading}
            loadingText="Assigning..."
            fullWidth={false}
            disabled={selectedIds.size === 0 || engineers.length === 0}
          >
            🔧 Assign {selectedIds.size > 0 ? `${selectedIds.size} Tool${selectedIds.size > 1 ? "s" : ""}` : "Tools"}
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default AssignToolModal;
