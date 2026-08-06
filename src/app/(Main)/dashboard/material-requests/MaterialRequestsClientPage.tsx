"use client";

// ============================================================
// src/app/(Main)/dashboard/material-requests/MaterialRequestsClientPage.tsx
// Client component for Material Requests management
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ApproveRequestModal } from "@/components/projects/ApproveRequestModal";
import { IssueMaterialModal } from "@/components/projects/IssueMaterialModal";
import { formatDate } from "@/lib/dateUtils";

interface MaterialRequestsClientPageProps {
  requests: any[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentStatus?: string;
}

export function MaterialRequestsClientPage({
  requests,
  total,
  page,
  totalPages,
  currentSearch,
  currentStatus,
}: MaterialRequestsClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [selectedApproveRequest, setSelectedApproveRequest] = useState<any | null>(null);
  const [selectedIssueRequest, setSelectedIssueRequest] = useState<any | null>(null);

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

  function handleStatusFilter(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("status", val);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search request #, project name, engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg"
          >
            Search
          </button>
        </form>

        <select
          value={currentStatus || ""}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="ISSUED">ISSUED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Request No</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Engineer</th>
              <th className="px-4 py-3">Submitted Date</th>
              <th className="px-4 py-3">Items Count</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No material requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                    {req.requestNo}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                    <Link href={`/dashboard/projects/${req.project?.id}`} className="hover:underline">
                      {req.project?.projectName} ({req.project?.projectCode})
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300">
                    {req.engineer?.name || "Engineer"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{req.items?.length || 0} item(s)</td>
                  <td className="px-4 py-3.5">
                    <ProjectStatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => setSelectedApproveRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 rounded-md"
                      >
                        PM Approve
                      </button>
                    )}

                    {(req.status === "APPROVED" || req.status === "PARTIAL") && (
                      <button
                        onClick={() => setSelectedIssueRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md shadow-sm"
                      >
                        Issue FIFO
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedApproveRequest && (
        <ApproveRequestModal
          isOpen={Boolean(selectedApproveRequest)}
          onClose={() => {
            setSelectedApproveRequest(null);
            router.refresh();
          }}
          requestId={selectedApproveRequest.id}
          requestNo={selectedApproveRequest.requestNo}
          items={selectedApproveRequest.items}
        />
      )}

      {selectedIssueRequest && (
        <IssueMaterialModal
          isOpen={Boolean(selectedIssueRequest)}
          onClose={() => {
            setSelectedIssueRequest(null);
            router.refresh();
          }}
          requestId={selectedIssueRequest.id}
          requestNo={selectedIssueRequest.requestNo}
          items={selectedIssueRequest.items.map((i: any) => ({
            inventoryName: i.inventory.name,
            qtyApproved: i.qtyApproved,
            qtyIssued: i.qtyIssued,
            unit: i.inventory.unit,
          }))}
        />
      )}
    </div>
  );
}

export default MaterialRequestsClientPage;
