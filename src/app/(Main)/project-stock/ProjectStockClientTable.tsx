"use client";

// ============================================================
// src/app/(Main)/project-stock/ProjectStockClientTable.tsx
// Interactive Project Stock Table with Search & Server Pagination
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

interface SerializedProjectMaterial {
  id: number;
  issuedQty: number;
  returnedQty: number;
  balanceQty: number;
  status: string;
  project: {
    id: number;
    projectName: string;
    projectCode: string;
  };
  inventory: {
    id: number;
    name: string;
    itemCode: string;
  };
  materialIssueItem?: {
    stockBatchId?: number;
    stockBatch?: {
      batchNo: string;
    } | null;
  } | null;
}

interface ProjectStockClientTableProps {
  projectMaterials: SerializedProjectMaterial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  currentSearch: string;
}

export function ProjectStockClientTable({
  projectMaterials,
  total,
  page,
  limit,
  totalPages,
  currentSearch,
}: ProjectStockClientTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate pagination buttons array
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Search project, code, material name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">FIFO Batch</th>
              <th className="px-4 py-3">Issued Qty</th>
              <th className="px-4 py-3">Returned Qty</th>
              <th className="px-4 py-3">Balance Qty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {projectMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {currentSearch ? "No matching materials found." : "No materials currently assigned to any project."}
                </td>
              </tr>
            ) : (
              projectMaterials.map((pm) => (
                <tr key={pm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                    <Link href={`/projects/${pm.project.id}`} className="hover:underline">
                      {pm.project.projectName} ({pm.project.projectCode})
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{pm.inventory.name}</div>
                    <div className="text-xs text-gray-400">{pm.inventory.itemCode}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                    {pm.materialIssueItem?.stockBatch?.batchNo ||
                      (pm.materialIssueItem?.stockBatchId
                        ? `Batch #${pm.materialIssueItem.stockBatchId}`
                        : "N/A")}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-blue-600">
                    {pm.issuedQty}
                  </td>
                  <td className="px-4 py-3.5 text-orange-600">
                    {pm.returnedQty}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100">
                    {pm.balanceQty}
                  </td>
                  <td className="px-4 py-3.5">
                    <ProjectStatusBadge status={pm.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/projects/${pm.project.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Project Details</span>
                      <span className="text-xs leading-none">→</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
          <span className="text-gray-500 text-xs sm:text-sm">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startRecord}</span> to{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{endRecord}</span> of{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span> assigned material records
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {getPageNumbers().map((pNum, idx) =>
              pNum === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${pNum}`}
                  onClick={() => handlePageChange(pNum as number)}
                  className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                    page === pNum
                      ? "bg-red-600 text-white border-red-600 font-semibold"
                      : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {pNum}
                </button>
              )
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
