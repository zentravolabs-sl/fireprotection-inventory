"use client";

// ============================================================
// src/components/projects/ProjectMaterialUsageTab.tsx
// Displays assigned (issued) materials and lets Super Admin &
// Engineer record how much was actually consumed/installed.
// ============================================================

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormButton } from "@/components/ui/FormButton";
import { usePermissions } from "@/hooks/usePermissions";
import { updateMaterialUsageAction } from "@/app/actions/material-usage";

// Shape that comes from project.projectMaterials (ProjectMaterial rows)
interface AssignedMaterial {
  id: number;
  issuedQty: number;
  returnedQty: number;
  balanceQty: number;
  usedQty: number;
  status: string;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
  };
  materialIssueItem?: {
    stockBatch?: {
      batchNo?: string | null;
      id?: number;
      unitCost?: number;
    } | null;
  } | null;
}

interface ProjectMaterialUsageTabProps {
  projectId: number;
  assignedMaterials: AssignedMaterial[];
  onRefresh: () => void;
  currentUserRole?: string;
}

export function ProjectMaterialUsageTab({
  projectId,
  assignedMaterials,
  onRefresh,
  currentUserRole,
}: ProjectMaterialUsageTabProps) {
  const { isSuperAdmin } = usePermissions();

  // Allow Super Admin and Engineer to record usage
  const canRecordUsage =
    isSuperAdmin ||
    currentUserRole === "ENGINEER" ||
    currentUserRole === "SUPER_ADMIN";

  const [editingMat, setEditingMat] = useState<AssignedMaterial | null>(null);
  const [usedQtyInput, setUsedQtyInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function openEdit(mat: AssignedMaterial) {
    setEditingMat(mat);
    setUsedQtyInput(mat.usedQty > 0 ? mat.usedQty.toString() : "");
    setError(null);
    setSuccessMsg(null);
  }

  function closeEdit() {
    setEditingMat(null);
    setUsedQtyInput("");
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMat) return;

    const val = parseFloat(usedQtyInput);
    if (isNaN(val) || val < 0) {
      setError("Please enter a valid quantity (0 or more).");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateMaterialUsageAction(projectId, editingMat.id, val);

    setLoading(false);

    if (res.success) {
      closeEdit();
      onRefresh();
    } else {
      setError(res.message);
    }
  }

  // Aggregated stats
  const totalIssued = assignedMaterials.reduce((s, m) => s + m.issuedQty, 0);
  const totalReturned = assignedMaterials.reduce((s, m) => s + m.returnedQty, 0);
  const totalUsed = assignedMaterials.reduce((s, m) => s + (m.usedQty || 0), 0);
  const totalBalance = assignedMaterials.reduce((s, m) => s + m.balanceQty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              📦 Material Usage Tracker
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Shows all materials issued to this project. Engineers &amp; Super
              Admin can record how much was actually consumed / installed on
              site.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {assignedMaterials.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                Total Issued (lines)
              </p>
              <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                {totalIssued.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500 dark:text-orange-400">
                Total Returned
              </p>
              <p className="text-lg font-extrabold text-orange-700 dark:text-orange-300">
                {totalReturned.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Total Used (on-site)
              </p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                {totalUsed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Net Balance
              </p>
              <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">
                {totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Material Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {assignedMaterials.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <div className="text-4xl">📦</div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              No Materials Issued Yet
            </p>
            <p className="text-xs">
              Once materials are issued via approved material requests, they will
              appear here for usage tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">Item Code</th>
                  <th className="px-5 py-3.5">Material Name</th>
                  <th className="px-5 py-3.5">FIFO Batch</th>
                  <th className="px-5 py-3.5 text-right">Issued Qty</th>
                  <th className="px-5 py-3.5 text-right">Returned Qty</th>
                  <th className="px-5 py-3.5 text-right">Balance Qty</th>
                  <th className="px-5 py-3.5 text-right">Used Qty</th>
                  <th className="px-5 py-3.5">Usage %</th>
                  <th className="px-5 py-3.5">Status</th>
                  {canRecordUsage && (
                    <th className="px-5 py-3.5 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {assignedMaterials.map((mat) => {
                  const usagePct =
                    mat.issuedQty > 0
                      ? Math.min(
                          100,
                          Math.round(((mat.usedQty || 0) / mat.issuedQty) * 100)
                        )
                      : 0;

                  const batchLabel =
                    mat.materialIssueItem?.stockBatch?.batchNo ||
                    (mat.materialIssueItem?.stockBatch?.id
                      ? `Batch #${mat.materialIssueItem.stockBatch.id}`
                      : "—");

                  const statusColor =
                    mat.status === "FULLY_RETURNED"
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : mat.status === "PARTIALLY_RETURNED"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300";

                  return (
                    <tr
                      key={mat.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-red-600 dark:text-red-400 text-[11px]">
                        {mat.inventory.itemCode}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                        {mat.inventory.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-gray-500">
                        {batchLabel}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {mat.issuedQty.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-orange-600 dark:text-orange-400 font-semibold">
                        {mat.returnedQty.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-teal-600 dark:text-teal-400">
                        {mat.balanceQty.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {mat.usedQty > 0 ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {mat.usedQty.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                usagePct >= 80
                                  ? "bg-emerald-500"
                                  : usagePct >= 40
                                  ? "bg-amber-400"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 w-8 text-right">
                            {usagePct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}
                        >
                          {mat.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      {canRecordUsage && (
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => openEdit(mat)}
                            className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                          >
                            ✏ Record Usage
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Usage Modal */}
      <Modal
        isOpen={!!editingMat}
        onClose={closeEdit}
        title="Record Material Usage"
      >
        {editingMat && (() => {
          // Derived values for this material
          const netAvailable = editingMat.issuedQty - editingMat.returnedQty;
          const alreadyUsed = editingMat.usedQty || 0;
          // remaining = how much has not yet been used (balance before this edit)
          const remaining = Math.max(0, netAvailable - alreadyUsed);
          // live balance preview as user types
          const inputVal = parseFloat(usedQtyInput);
          const previewBalance = !isNaN(inputVal)
            ? Math.max(0, netAvailable - inputVal)
            : netAvailable - alreadyUsed;

          return (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Material Info Banner */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                  {editingMat.inventory.itemCode}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {editingMat.inventory.name}
                </p>

                {/* Qty breakdown grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Issued</p>
                    <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">{editingMat.issuedQty.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Returned</p>
                    <p className="text-sm font-extrabold text-orange-600">{editingMat.returnedQty.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                    <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Already Used</p>
                    <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                      {alreadyUsed > 0 ? alreadyUsed.toLocaleString() : <span className="text-gray-400 font-normal italic text-xs">None</span>}
                    </p>
                  </div>
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800 text-center">
                    <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-wide">Remaining</p>
                    <p className="text-sm font-extrabold text-teal-700 dark:text-teal-300">{remaining.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Total Used Quantity (Cumulative — Consumed / Installed){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={netAvailable}
                  value={usedQtyInput}
                  onChange={(e) => setUsedQtyInput(e.target.value)}
                  placeholder={`Current: ${alreadyUsed} | Max: ${netAvailable}`}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm font-bold border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Enter the <strong>total cumulative</strong> quantity used so far (0 – {netAvailable}).
                  {" "}Remaining balance will update to{" "}
                  <strong className={previewBalance < 0 ? "text-red-500" : "text-teal-600 dark:text-teal-400"}>
                    {Math.max(0, previewBalance).toLocaleString()}
                  </strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <FormButton
                  type="button"
                  variant="secondary"
                  onClick={closeEdit}
                  disabled={loading}
                >
                  Cancel
                </FormButton>
                <FormButton type="submit" loading={loading} disabled={loading}>
                  Save Usage
                </FormButton>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}
