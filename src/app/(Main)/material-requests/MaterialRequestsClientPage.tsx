"use client";

// ============================================================
// src/app/(Main)/material-requests/MaterialRequestsClientPage.tsx
// Client component for Material Requests management
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Select from "react-select";
import { getCustomSelectStyles } from "@/lib/selectStyles";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ApproveRequestModal } from "@/components/projects/ApproveRequestModal";
import { IssueMaterialModal } from "@/components/projects/IssueMaterialModal";
import { formatDate } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/usePermissions";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_GM", label: "PENDING PE REVIEW" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "PARTIAL", label: "PARTIAL" },
  { value: "ISSUED", label: "ISSUED" },
  { value: "REJECTED", label: "REJECTED" },
];

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
  const { can, userRole, isSuperAdmin } = usePermissions();

  const [search, setSearch] = useState(currentSearch);
  const [selectedApproveRequest, setSelectedApproveRequest] = useState<any | null>(null);
  const [selectedIssueRequest, setSelectedIssueRequest] = useState<any | null>(null);

  const selectedStatusOption =
    STATUS_OPTIONS.find((opt) => opt.value === (currentStatus || "")) || STATUS_OPTIONS[0];

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
            className="flex-1 px-4 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 h-[40px]"
          />
          <button
            type="submit"
            className="px-4 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors h-[40px] inline-flex items-center justify-center"
          >
            Search
          </button>
        </form>

        <div className="w-56 sm:w-64">
          <Select
            instanceId="material-request-status-filter"
            classNamePrefix="react-select"
            options={STATUS_OPTIONS}
            value={selectedStatusOption}
            onChange={(val) => handleStatusFilter(val ? val.value : "")}
            isSearchable={false}
            styles={getCustomSelectStyles(false, "40px")}
          />
        </div>
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
                    <Link href={`/projects/${req.project?.id}`} className="hover:underline">
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
                    {/* Show rejection note to engineer */}
                    {req.status === "REJECTED" && req.remarks && (
                      <div className="mt-2 max-w-[240px] px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 mb-0.5">❌ Rejection Note:</p>
                        <p className="text-[11px] text-red-600 dark:text-red-300 leading-relaxed">{req.remarks}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {/* Purchase Engineer Review Step */}
                    {(req.status === "PENDING" || req.status === "PENDING_GM") &&
                      (userRole === "PURCHASE_ENGINEER" || isSuperAdmin) && (
                        <button
                          onClick={() => setSelectedApproveRequest(req)}
                          className="px-3 py-1.5 text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900 rounded-md border border-cyan-200 dark:border-cyan-800 transition-colors"
                        >
                          🔍 PE Review
                        </button>
                      )}

                    {/* Inventory Controller FIFO Issue */}
                    {(req.status === "APPROVED" || req.status === "PARTIAL") &&
                      (userRole === "INVENTORY_CONTROLLER" || isSuperAdmin) && (
                        <button
                          onClick={() => setSelectedIssueRequest(req)}
                          className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-md shadow-sm transition-colors"
                        >
                          ⚡ Issue FIFO
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
            unit: "",
          }))}
        />
      )}
    </div>
  );
}

export default MaterialRequestsClientPage;
