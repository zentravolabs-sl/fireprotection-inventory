"use client";

// ============================================================
// src/app/(Main)/projects/ProjectsClientPage.tsx
// Client component for projects search, filtering, and table actions
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { usePermissions } from "@/hooks/usePermissions";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "PENDING" },
  { value: "MATERIAL_REQUEST", label: "MATERIAL REQUEST" },
  { value: "MATERIAL_APPROVED", label: "MATERIAL APPROVED" },
  { value: "MATERIAL_ISSUED", label: "MATERIAL ISSUED" },
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

interface ProjectsClientPageProps {
  projects: any[];
  total: number;
  page: number;
  limit?: number;
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
  limit = 5,
  totalPages,
  customers,
  users,
  currentSearch,
  currentStatus,
}: ProjectsClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = usePermissions();

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
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectedStatusOption =
    STATUS_OPTIONS.find((opt) => opt.value === (currentStatus || "")) || STATUS_OPTIONS[0];

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

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
          <div className="w-56 sm:w-64">
            <Select
              instanceId="project-status-filter"
              classNamePrefix="react-select"
              options={STATUS_OPTIONS}
              value={selectedStatusOption}
              onChange={(val) => handleStatusFilter(val ? val.value : "")}
              isSearchable={false}
              styles={getCustomSelectStyles()}
            />
          </div>

          {can("project.create") && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap h-[46px]"
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>New Project</span>
            </button>
          )}
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const leadEng = proj.engineers?.find((e: any) => e.isLead)?.engineer;
                const totalEngCount = proj.engineers?.length || 0;

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
                        href={`/projects/${proj.id}`}
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
                    <td className="px-4 py-3.5">
                      <ProjectStatusBadge status={proj.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span>View Details</span>
                        <span className="text-xs leading-none">→</span>
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
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
          <span className="text-gray-500 text-xs sm:text-sm">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startRecord}</span> to{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{endRecord}</span> of{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span> total projects
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
                  className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${page === pNum
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
