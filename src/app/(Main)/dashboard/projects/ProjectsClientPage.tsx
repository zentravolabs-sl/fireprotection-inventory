"use client";

// ============================================================
// src/app/(Main)/dashboard/projects/ProjectsClientPage.tsx
// Client component for projects search, filtering, and table actions
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { formatCurrency } from "@/lib/dateUtils";

interface ProjectsClientPageProps {
  projects: any[];
  total: number;
  page: number;
  totalPages: number;
  customers: { id: number; companyName: string }[];
  users: { id: string; name: string; role: string }[];
  currentSearch: string;
  currentStatus?: string;
}

export function ProjectsClientPage({
  projects,
  total,
  page,
  totalPages,
  customers,
  users,
  currentSearch,
  currentStatus,
}: ProjectsClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState(currentSearch);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleStatusFilter(statusVal: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (statusVal) {
      params.set("status", statusVal);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by code, project name, customer, location..."
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

        <div className="flex items-center gap-3">
          <select
            value={currentStatus || ""}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="MATERIAL_REQUEST">MATERIAL REQUEST</option>
            <option value="MATERIAL_APPROVED">MATERIAL APPROVED</option>
            <option value="MATERIAL_ISSUED">MATERIAL ISSUED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Project Name</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3 text-right">Project Value</th>
              <th className="px-4 py-3 text-right">Estimated Cost</th>
              <th className="px-4 py-3 text-right">Actual Cost</th>
              <th className="px-4 py-3 text-right">Actual Profit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const leadEng = proj.engineers?.find((e: any) => e.isLead)?.engineer;
                const totalEngCount = proj.engineers?.length || 0;
                const cost = proj.costBreakdown;

                return (
                  <tr
                    key={proj.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {proj.projectCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/projects/${proj.id}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        {proj.projectName}
                      </Link>
                      {proj.location && (
                        <div className="text-xs text-gray-400">📍 {proj.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                      {proj.customer?.companyName || "N/A"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                      <div>
                        PM: <strong>{proj.projectManager?.name || "Unassigned"}</strong>
                      </div>
                      <div className="text-gray-500">
                        Lead: {leadEng ? leadEng.name : "None"}{" "}
                        {totalEngCount > 0 && <span className="font-semibold text-blue-600">({totalEngCount} eng)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {formatCurrency(cost?.projectValue || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(cost?.estimatedTotalCost || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(cost?.actualTotalCost || 0)}
                    </td>
                    <td className={`px-4 py-3.5 text-right text-xs font-bold ${(cost?.actualProfit || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
                      {formatCurrency(cost?.actualProfit || 0)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ProjectStatusBadge status={proj.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/projects/${proj.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-block"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
          <span className="text-gray-500">
            Showing page {page} of {totalPages} ({total} total projects)
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 border rounded-md disabled:opacity-50 text-xs font-medium"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 border rounded-md disabled:opacity-50 text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <ProjectFormModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
          customers={customers}
          users={users}
        />
      )}
    </div>
  );
}

export default ProjectsClientPage;
