"use client";

// ============================================================
// src/app/(Main)/super-admin/PendingExpenseActions.tsx
// Client component for approve/reject buttons on the Super Admin
// pending expense approval table.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveExpenseAction, rejectExpenseAction } from "@/app/actions/expenses";

interface Props {
  expenseId: number;
  expenseNo: string;
  projectId: number;
}

export function PendingExpenseActions({ expenseId, expenseNo, projectId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleApprove() {
    if (!confirm(`Approve expense ${expenseNo}? It will be added to the project actual cost.`)) return;
    setLoading(true);
    const res = await approveExpenseAction(expenseId);
    setLoading(false);
    if (res.success) {
      setDone("approved");
      setMessage(res.message);
      router.refresh();
    } else {
      setMessage(res.message);
    }
  }

  async function handleReject() {
    const note = prompt(`Reason for rejecting ${expenseNo} (optional):`);
    if (note === null) return; // user cancelled
    setLoading(true);
    const res = await rejectExpenseAction(expenseId, note || undefined);
    setLoading(false);
    if (res.success) {
      setDone("rejected");
      setMessage(res.message);
      router.refresh();
    } else {
      setMessage(res.message);
    }
  }

  if (done === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-green-100 text-green-800 rounded-full">
        ✓ Approved
      </span>
    );
  }
  if (done === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-red-100 text-red-800 rounded-full">
        ✕ Rejected
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        disabled={loading}
        onClick={handleApprove}
        id={`approve-expense-${expenseId}`}
        className="px-3 py-1.5 text-[11px] font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? "…" : "✓ Approve"}
      </button>
      <button
        disabled={loading}
        onClick={handleReject}
        id={`reject-expense-${expenseId}`}
        className="px-3 py-1.5 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
      >
        ✕ Reject
      </button>
    </div>
  );
}
