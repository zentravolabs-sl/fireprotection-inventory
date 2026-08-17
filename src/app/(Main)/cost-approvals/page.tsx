// ============================================================
// src/app/(Main)/cost-approvals/page.tsx
// Dedicated Cost Threshold Expense Approvals page — ADMIN only.
// ============================================================

import { requireRole } from "@/lib/session";
import { AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";
import { findPendingApprovalExpenses } from "@/lib/repositories/expenseRepository";
import { formatCurrency } from "@/lib/dateUtils";
import { PendingExpenseActions } from "./PendingExpenseActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cost Approvals — CDN Fire Engineering",
};

export default async function CostApprovalsPage() {
  // Only ADMIN role can access the cost approvals page
  const session = await requireRole("ADMIN");
  const user = session.user as { name: string; role?: string };

  const pendingExpenses = await findPendingApprovalExpenses();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header Card */}
      <div className="bg-[#0F1524] rounded-2xl border border-[#1e2a3d] shadow-sm p-6 sm:p-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-900/30 flex items-center justify-center">
            <ShieldCheck size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#dce3ef]">
              Cost Threshold Approvals
            </h1>
            <p className="text-[#5a657a] text-xs sm:text-sm mt-0.5">
              Review and approve/reject project expenses held when current month total cost reaches LKR 5,000,000.
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-[#5a657a]">
          Logged in as <strong className="text-[#dce3ef]">{user.name}</strong> ({user.role})
        </div>
      </div>

      {/* ── Cost Threshold Pending Approvals ────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                💰 Pending Expense Approvals Queue
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expenses held for review because the combined monthly project actual cost reached LKR 5,000,000.
              </p>
            </div>
          </div>
          {pendingExpenses.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
              {pendingExpenses.length} pending
            </span>
          )}
        </div>

        {pendingExpenses.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400 dark:text-gray-600">
            <CheckCircle size={36} className="mb-3 text-green-400" />
            <p className="text-sm font-medium">No pending expense approvals</p>
            <p className="text-xs mt-1">All cost-threshold expenses have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Expense No</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Submitted By</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pendingExpenses.map((exp) => (
                  <tr key={exp.id} className="bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">
                      {exp.expenseNo}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {exp.project.projectCode}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {exp.project.projectName}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        exp.expenseType === "LABOUR"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : exp.expenseType === "EQUIPMENT"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {exp.expenseType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="line-clamp-2 text-gray-700 dark:text-gray-300">
                        {exp.description || "No description"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {exp.createdByUser.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(exp.expenseDate).toLocaleDateString("en-LK")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-amber-700 dark:text-amber-400 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <PendingExpenseActions
                        expenseId={exp.id}
                        expenseNo={exp.expenseNo}
                        projectId={exp.project.id}
                      />
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
