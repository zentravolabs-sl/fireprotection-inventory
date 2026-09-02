"use client";

// ============================================================
// src/components/fire-extinguishers/CustomerRefillsClient.tsx
// Customer Refills — List / Dashboard Client Component
// ============================================================

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Flame,
  Search,
  Plus,
  RefreshCw,
  CalendarRange,
  Building2,
  Badge,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { getCustomerRefillsAction } from "@/app/actions/customer-refills";
import { formatDate } from "@/lib/dateUtils";
import { ExpiringRefillItemsTable } from "./ExpiringRefillItemsTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type RefillStatus = "DRAFT" | "RECEIVED" | "IN_PROGRESS" | "READY_TO_RETURN" | "COMPLETED" | "CANCELLED";

interface CustomerRefill {
  id: number;
  refillNo: string;
  status: RefillStatus;
  receivedDate: string;
  completedDate: string | null;
  notes: string | null;
  customer: { id: number; companyName: string; contactPerson: string | null; phone: string | null };
  createdBy: { id: string; name: string } | null;
  items: { id: number; extinguisherType: string; capacity: string | null; receivedQty: number; returnedQty: number }[];
  replacements: {
    id: number;
    issuedQty: number;
    returnedQty: number;
    status: string;
    inventory: { itemCode: string; name: string };
  }[];
}

const STATUS_CONFIG: Record<RefillStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: "Draft", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  RECEIVED: { label: "Received", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-400", dot: "bg-amber-500" },
  READY_TO_RETURN: { label: "Ready to Return", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-400", dot: "bg-purple-500" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: RefillStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const TABS: { value: "ALL" | RefillStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY_TO_RETURN", label: "Ready to Return" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DRAFT", label: "Drafts" },
];

export function CustomerRefillsClient() {
  const [tab, setTab] = useState<"ALL" | RefillStatus>("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refills, setRefills] = useState<CustomerRefill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = () => {
    setLoading(true);
    startTransition(async () => {
      const result = await getCustomerRefillsAction({
        tab: tab === "ALL" ? undefined : tab,
        search: search.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (result.success && result.data) {
        setRefills(result.data as CustomerRefill[]);
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [tab, dateFrom, dateTo]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); };

  // Stats
  const counts = {
    RECEIVED: refills.filter((r) => r.status === "RECEIVED").length,
    IN_PROGRESS: refills.filter((r) => r.status === "IN_PROGRESS").length,
    READY_TO_RETURN: refills.filter((r) => r.status === "READY_TO_RETURN").length,
    COMPLETED: refills.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Customer Refills</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage customer-owned fire extinguisher refill jobs
            </p>
          </div>
        </div>
        <Link
          href="/fire-extinguishers/customer-refills/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md hover:shadow-lg shadow-red-500/25 transition-all"
        >
          <Plus size={16} /> New Refill Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "RECEIVED", label: "Received", icon: <Clock size={18} />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { key: "IN_PROGRESS", label: "In Progress", icon: <Activity size={18} />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { key: "READY_TO_RETURN", label: "Ready to Return", icon: <Badge size={18} />, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { key: "COMPLETED", label: "Completed", icon: <CheckCircle size={18} />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map(({ key, label, icon, color, bg }) => (
          <button
            key={key}
            onClick={() => setTab(key as RefillStatus)}
            className={`${bg} rounded-2xl p-4 text-left transition-all border-2 ${
              tab === key ? "border-current opacity-100 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
            } ${color}`}
          >
            <div className="mb-2">{icon}</div>
            <div className="text-2xl font-black">{counts[key as keyof typeof counts]}</div>
            <div className="text-[11px] font-semibold mt-0.5 text-gray-600 dark:text-gray-400">{label}</div>
          </button>
        ))}
      </div>

      {/* Expiry Warning Table */}
      <ExpiringRefillItemsTable />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search by refill no, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={15} className={isPending ? "animate-spin" : ""} />
            </button>
          </div>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                tab === t.value
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="animate-spin text-red-600" />
          </div>
        ) : refills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Flame size={28} className="opacity-30" />
            <p className="text-xs">No customer refill jobs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="py-3 px-4">Refill No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-center">Replacements</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {refills.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/fire-extinguishers/customer-refills/${r.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{r.refillNo}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px] font-black shrink-0">
                          {r.customer.companyName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{r.customer.companyName}</div>
                          {r.customer.contactPerson && (
                            <div className="text-[10px] text-gray-400">{r.customer.contactPerson}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDate(r.receivedDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold">
                        {r.items.length}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.replacements.length > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold">
                          {r.replacements.length}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/fire-extinguishers/customer-refills/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
