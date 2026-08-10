"use client";

// ============================================================
// src/app/(Main)/dashboard/transfers/TransfersClientPage.tsx
// Project Transfers Module Main Client View
// ============================================================

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProjectTransfersAction } from "@/app/actions/transfers";
import { CreateTransferModal } from "@/components/transfers/CreateTransferModal";
import { TransferDetailModal } from "@/components/transfers/TransferDetailModal";
import { formatDate } from "@/lib/dateUtils";

interface TransfersClientPageProps {
  initialTransfers: any[];
  initialCounts: {
    DRAFT: number;
    PENDING: number;
    APPROVED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  projects: Array<{
    id: number;
    projectCode: string;
    projectName: string;
  }>;
  currentUserRole?: string;
}

export function TransfersClientPage({
  initialTransfers,
  initialCounts,
  projects,
  currentUserRole = "ADMIN",
}: TransfersClientPageProps) {
  const router = useRouter();

  const [transfers, setTransfers] = useState<any[]>(initialTransfers);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromProjectFilter, setFromProjectFilter] = useState<number>(0);
  const [toProjectFilter, setToProjectFilter] = useState<number>(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);

  async function fetchTransfers() {
    setLoading(true);
    const res = await getProjectTransfersAction({
      search: search || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
      fromProjectId: fromProjectFilter || undefined,
      toProjectId: toProjectFilter || undefined,
    });
    setLoading(false);

    if (res.success && res.data) {
      setTransfers(res.data);
      if (res.counts) setCounts(res.counts);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, [search, statusFilter, fromProjectFilter, toProjectFilter]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "DRAFT":
        return "bg-gray-800 text-gray-300 border-gray-700";
      case "PENDING":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "APPROVED":
        return "bg-blue-950 text-blue-300 border-blue-800";
      case "COMPLETED":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "CANCELLED":
        return "bg-red-950 text-red-300 border-red-800";
      default:
        return "bg-gray-800 text-gray-300 border-gray-700";
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Title & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-xl">🔄</span>
            <h1 className="text-2xl font-bold text-gray-100">Project to Project Stock Transfers</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Transfer unused materials, pipe cut pieces, and tools directly between projects.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> Transfer to Project
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === "PENDING"
              ? "bg-amber-950/60 border-amber-600"
              : "bg-gray-900 border-gray-800 hover:border-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
            Pending Approval
          </span>
          <span className="text-2xl font-black text-amber-200 mt-1 block">{counts.PENDING || 0}</span>
          <span className="text-[10px] text-gray-400">Awaiting Manager Review</span>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === "APPROVED"
              ? "bg-blue-950/60 border-blue-600"
              : "bg-gray-900 border-gray-800 hover:border-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
            Approved Transfers
          </span>
          <span className="text-2xl font-black text-blue-200 mt-1 block">{counts.APPROVED || 0}</span>
          <span className="text-[10px] text-gray-400">Ready for Completion</span>
        </div>

        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-950/60 border-emerald-600"
              : "bg-gray-900 border-gray-800 hover:border-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            Completed Transfers
          </span>
          <span className="text-2xl font-black text-emerald-200 mt-1 block">{counts.COMPLETED || 0}</span>
          <span className="text-[10px] text-gray-400">Stock Updated & Audited</span>
        </div>

        <div
          onClick={() => setStatusFilter("CANCELLED")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === "CANCELLED"
              ? "bg-red-950/60 border-red-600"
              : "bg-gray-900 border-gray-800 hover:border-gray-700"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
            Cancelled Transfers
          </span>
          <span className="text-2xl font-black text-red-200 mt-1 block">{counts.CANCELLED || 0}</span>
          <span className="text-[10px] text-gray-400">Voided Documents</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">Search</label>
            <input
              type="text"
              placeholder="Search Transfer No, Project, User..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Source Project Filter */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">From Project</label>
            <select
              value={fromProjectFilter}
              onChange={(e) => setFromProjectFilter(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500"
            >
              <option value={0}>All Source Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Project Filter */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">To Project</label>
            <select
              value={toProjectFilter}
              onChange={(e) => setToProjectFilter(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500"
            >
              <option value={0}>All Destination Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Data Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950 uppercase font-semibold text-[11px] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3.5">Transfer No</th>
                <th className="px-4 py-3.5">From Project</th>
                <th className="px-4 py-3.5">To Project</th>
                <th className="px-4 py-3.5">Transfer Date</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Requested By</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 animate-pulse">
                    Loading project transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No project transfers found matching the criteria.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelectedTransfer(t)}
                        className="font-mono font-bold text-red-400 hover:underline"
                      >
                        {t.transferNo}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-100">
                      {t.fromProject?.projectCode}
                      <div className="text-[11px] text-gray-400 font-normal">
                        {t.fromProject?.projectName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-400">
                      {t.toProject?.projectCode}
                      <div className="text-[11px] text-gray-400 font-normal">
                        {t.toProject?.projectName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{formatDate(t.transferDate)}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-200">
                      {(t.items || []).length} Item(s)
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{t.requestedBy?.name || "System"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedTransfer(t)}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTransfers}
        projects={projects}
      />

      <TransferDetailModal
        transfer={selectedTransfer}
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        onRefresh={fetchTransfers}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
