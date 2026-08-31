"use client";

// ============================================================
// src/app/(Main)/material-requests/new/page.tsx
// Direct Material Request Creation Page
// ============================================================

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import {
  createMaterialRequestAction,
  getInventoryOptionsAction,
} from "@/app/actions/material-requests";

export default function NewMaterialRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const [requestQuantities, setRequestQuantities] = useState<{ [inventoryId: number]: number }>({});
  const [remarks, setRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch projects user can access
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects/user-accessible");
        if (res.ok) {
          const data = await res.json();
          setProjectsList(data.projects || []);
          if (preselectedProjectId) {
            const match = (data.projects || []).find((p: any) => p.id === Number(preselectedProjectId));
            if (match) setSelectedProject(match);
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [preselectedProjectId]);

  // Load inventory materials when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setInventoryItems([]);
      return;
    }

    async function loadMaterials() {
      setLoadingMaterials(true);
      setError(null);
      setRequestQuantities({});

      const res = await getInventoryOptionsAction(selectedProject.id);
      setLoadingMaterials(false);
      if (res.success) {
        setInventoryItems(res.data || []);
      } else {
        setError(res.message || "Failed to load inventory items");
      }
    }

    loadMaterials();
  }, [selectedProject]);

  function handleQtyChange(inventoryId: number, val: string) {
    const num = parseFloat(val) || 0;
    const inv = inventoryItems.find((i: any) => i.id === inventoryId);
    // Clamp to remainingEstimate if estimate is not yet exhausted
    const max =
      inv && inv.remainingEstimate !== null && inv.remainingEstimate > 0
        ? inv.remainingEstimate
        : Infinity;
    const clamped = num < 0 ? 0 : num > max ? max : num;
    setRequestQuantities((prev) => ({
      ...prev,
      [inventoryId]: clamped,
    }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    const itemsToSubmit = Object.entries(requestQuantities)
      .map(([inventoryId, qtyRequested]) => ({
        inventoryId: Number(inventoryId),
        qtyRequested,
      }))
      .filter((item) => item.qtyRequested > 0);

    if (itemsToSubmit.length === 0) {
      setError("Please enter a request quantity greater than 0 for at least one material item.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await createMaterialRequestAction({
      projectId: selectedProject.id,
      engineerId: "current_user",
      remarks: remarks || undefined,
      items: itemsToSubmit,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.push(`/projects/${selectedProject.id}`);
      }, 1500);
    } else {
      setError(res.message);
    }
  }

  const projectOptions = projectsList.map((p) => ({
    value: p.id,
    label: `${p.projectCode} — ${p.projectName}`,
  }));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Create Material Request
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Request materials from central warehouse for project execution
          </p>
        </div>
        <Link
          href="/material-requests"
          className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
        >
          ← Back to Material Requests
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl text-xs font-bold">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: SELECT PROJECT */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Select Project</h2>
          </div>

          {loadingProjects ? (
            <div className="text-xs text-gray-400 py-2">Loading projects...</div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Target Project *
              </label>
              <Select
                instanceId="new-mat-req-project-select"
                options={projectOptions}
                value={
                  selectedProject
                    ? { value: selectedProject.id, label: `${selectedProject.projectCode} — ${selectedProject.projectName}` }
                    : null
                }
                onChange={(val) => {
                  const match = projectsList.find((p) => p.id === (val ? val.value : null));
                  setSelectedProject(match || null);
                }}
                placeholder="Search and select project..."
                isSearchable
                styles={getCustomSelectStyles(false, "42px")}
              />
            </div>
          )}
        </div>

        {/* STEP 2: MATERIALS & QUANTITY ENTRY */}
        {selectedProject && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Enter Request Quantities
              </h2>
            </div>

            {loadingMaterials ? (
              <div className="text-xs text-gray-400 py-4">Loading warehouse materials...</div>
            ) : inventoryItems.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs">
                No inventory items found in warehouse master.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-800 uppercase font-semibold text-[11px] text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3">Material Item</th>
                        <th className="px-4 py-3">Unit</th>
                        <th className="px-4 py-3 text-right">Est. Qty</th>
                        <th className="px-4 py-3 text-right">Requested</th>
                        <th className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">Remaining</th>
                        <th className="px-4 py-3 text-right">Warehouse Stock</th>
                        <th className="px-4 py-3 text-right w-36">Request Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {inventoryItems.map((inv: any) => {
                        const currentReq = requestQuantities[inv.id] || 0;
                        const hasEstimate = inv.estimatedQty !== null;
                        const estimateExhausted = hasEstimate && inv.remainingEstimate <= 0;
                        const overLimit =
                          hasEstimate &&
                          !estimateExhausted &&
                          currentReq > inv.remainingEstimate;

                        return (
                          <tr
                            key={inv.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                              overLimit ? "bg-red-50 dark:bg-red-950/20" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 mr-2">
                                {inv.itemCode}
                              </span>
                              {inv.name}
                              {estimateExhausted && (
                                <span className="ml-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✅ Extra request OK
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                              {inv.unit}
                            </td>
                            {/* Estimated Qty */}
                            <td className="px-4 py-3 text-right">
                              {hasEstimate ? (
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {inv.estimatedQty}
                                </span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                            {/* Already Requested */}
                            <td className="px-4 py-3 text-right">
                              {hasEstimate ? (
                                <span className={`font-semibold ${
                                  estimateExhausted
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-orange-500 dark:text-orange-400"
                                }`}>
                                  {inv.alreadyRequestedQty}
                                </span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                            {/* Remaining Estimate */}
                            <td className="px-4 py-3 text-right">
                              {hasEstimate ? (
                                estimateExhausted ? (
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    Done
                                  </span>
                                ) : (
                                  <span className={`font-bold ${
                                    overLimit
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-indigo-600 dark:text-indigo-400"
                                  }`}>
                                    {inv.remainingEstimate}
                                    {overLimit && " ⚠"}
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                            {/* Warehouse Stock */}
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {inv.availableStock.toLocaleString()} {inv.unit}
                            </td>
                            {/* Request Qty input */}
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                max={
                                  hasEstimate && !estimateExhausted
                                    ? inv.remainingEstimate
                                    : undefined
                                }
                                value={currentReq === 0 ? "" : currentReq}
                                placeholder="0"
                                onChange={(e) => handleQtyChange(inv.id, e.target.value)}
                                className={`w-28 px-3 py-1.5 text-xs font-extrabold text-right border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:outline-none transition-colors ${
                                  overLimit
                                    ? "border-red-400 dark:border-red-700 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-red-500"
                                }`}
                              />
                              {overLimit && (
                                <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 text-right">
                                  Max: {inv.remainingEstimate}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Remarks / Request Justification
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Reason for request, site location, urgency..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end items-center space-x-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href={`/projects/${selectedProject.id}`}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors"
                  >
                    {submitting ? "Submitting Request..." : "Submit Material Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
