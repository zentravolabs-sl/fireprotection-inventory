// ============================================================
// src/app/(Main)/fire-extinguishers/[unitCode]/page.tsx
// Fire Extinguisher Unit Details & Complete History Timeline Page
// ============================================================

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFireExtinguisherUnitByCodeService } from "@/lib/services/fireExtinguisherService";
import {
  Flame,
  ArrowLeft,
  Calendar,
  Building,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  History,
  Box,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface UnitDetailsPageProps {
  params: Promise<{ unitCode: string }>;
}

export default async function FireExtinguisherUnitDetailsPage({ params }: UnitDetailsPageProps) {
  const { unitCode } = await params;
  const decodedCode = decodeURIComponent(unitCode);

  let data;
  try {
    data = await getFireExtinguisherUnitByCodeService(decodedCode);
  } catch (err) {
    notFound();
  }

  const { unit, activeAssignment, currentLocationStr, movements } = data;
  const isExpiringSoon = unit.expiryDate && new Date(unit.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/fire-extinguishers/assignments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Fire Extinguishers Overview
          </Link>
        </div>

        {/* Unit Top Summary Header */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <Flame size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  Unit #{unit.unitCode}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300">
                  {unit.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {unit.inventory.name} ({unit.inventory.itemCode})
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                <span>Serial No: <strong className="text-gray-800 dark:text-gray-200 font-mono">{unit.serialNumber || "N/A"}</strong></span>
                <span>Unit Capacity: <strong className="text-gray-800 dark:text-gray-200">{unit.inventory.unit}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full space-y-1 text-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CURRENT LOCATION / ASSIGNMENT:</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin size={16} className="text-red-600 shrink-0" />
              <span>{currentLocationStr}</span>
            </div>
            {activeAssignment?.location && (
              <div className="text-xs text-gray-500 pl-6">Specific Location: {activeAssignment.location}</div>
            )}
          </div>
        </div>

        {/* Technical Specs Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
            <div className="text-xs text-gray-500 font-medium">Manufacture Date</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
              {unit.manufactureDate ? new Date(unit.manufactureDate).toLocaleDateString() : "Not Specified"}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
            <div className="text-xs text-gray-500 font-medium">Refill / Expiry Date</div>
            <div className={`text-sm font-bold font-mono flex items-center gap-1.5 ${isExpiringSoon ? "text-amber-600" : "text-gray-900 dark:text-gray-100"}`}>
              {isExpiringSoon && <AlertTriangle size={15} />}
              {unit.expiryDate ? new Date(unit.expiryDate).toLocaleDateString() : "Not Specified"}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-1">
            <div className="text-xs text-gray-500 font-medium">Category / Sub-Category</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {unit.inventory.category.categoryName} {unit.inventory.subCategory ? `• ${unit.inventory.subCategory.name}` : ""}
            </div>
          </div>
        </div>

        {/* Section Tabs: Assignment History, Refill History, Stock Movements */}
        <div className="space-y-6">
          {/* Assignment History Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <History className="text-red-600" size={18} /> Complete Assignment History ({unit.assignments.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-2.5 px-3">Assigned Date</th>
                    <th className="py-2.5 px-3">Assigned To</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Returned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {unit.assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">
                        No assignment history recorded for this unit.
                      </td>
                    </tr>
                  ) : (
                    unit.assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                          {new Date(a.assignedDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-gray-100">
                          {a.project ? a.project.projectName : a.customer ? a.customer.companyName : "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {a.project ? "Project Site" : a.customer ? "Direct Client" : "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                          {a.location || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">
                          {a.returnedDate ? new Date(a.returnedDate).toLocaleDateString() : "Active"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refill History Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <RefreshCw className="text-amber-500" size={18} /> Refill & Service History ({unit.refillRecords.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-2.5 px-3">Received Date</th>
                    <th className="py-2.5 px-3">Location at Refill</th>
                    <th className="py-2.5 px-3">Temp Replacement Unit</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Completed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {unit.refillRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        No refill records for this unit.
                      </td>
                    </tr>
                  ) : (
                    unit.refillRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                          {new Date(r.receivedDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">
                          {r.assignment.project?.projectName || r.assignment.customer?.companyName || "Site"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-purple-700 dark:text-purple-300 font-bold">
                          {r.replacementUnit ? r.replacementUnit.unitCode : "None"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${r.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">
                          {r.completedDate ? new Date(r.completedDate).toLocaleDateString() : "Pending"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movements Ledger Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <TrendingUp className="text-blue-600" size={18} /> Stock Movement Audit Ledger
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Remarks / Transaction</th>
                    <th className="py-2.5 px-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        No stock movement ledger records found.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${m.movementType === "OUT" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {m.movementType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-700 dark:text-gray-300 font-semibold">
                          {m.referenceType}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                          {m.remarks || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {m.createdByUser.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
