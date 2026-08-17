"use client";

// ============================================================
// src/app/(Main)/cost-approvals/PendingExpenseActions.tsx
// Client component with custom UI Modals for Approve and Reject
// actions on the Cost Approvals table.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveExpenseAction, rejectExpenseAction } from "@/app/actions/expenses";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, AlertOctagon, Info } from "lucide-react";

interface Props {
  expenseId: number;
  expenseNo: string;
  projectId: number;
}

export function PendingExpenseActions({ expenseId, expenseNo, projectId }: Props) {
  const router = useRouter();

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleApproveSubmit() {
    setLoading(true);
    setErrorMsg(null);

    const res = await approveExpenseAction(expenseId);
    setLoading(false);

    if (res.success) {
      setDone("approved");
      setIsApproveOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.message);
    }
  }

  async function handleRejectSubmit() {
    setLoading(true);
    setErrorMsg(null);

    const res = await rejectExpenseAction(expenseId, rejectNote.trim() || undefined);
    setLoading(false);

    if (res.success) {
      setDone("rejected");
      setIsRejectOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.message);
    }
  }

  if (done === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 rounded-full">
        <CheckCircle2 size={13} />
        Approved
      </span>
    );
  }

  if (done === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded-full">
        <AlertOctagon size={13} />
        Rejected
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setErrorMsg(null);
            setIsApproveOpen(true);
          }}
          id={`approve-expense-${expenseId}`}
          className="px-3.5 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => {
            setErrorMsg(null);
            setRejectNote("");
            setIsRejectOpen(true);
          }}
          id={`reject-expense-${expenseId}`}
          className="px-3.5 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded-lg transition-colors flex items-center gap-1"
        >
          ✕ Reject
        </button>
      </div>

      {/* ── 1. APPROVE CONFIRMATION MODAL ────────────────────────────── */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => !loading && setIsApproveOpen(false)}
        title="Approve Expense Request"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl text-xs text-green-900 dark:text-green-200">
            <Info size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-green-800 dark:text-green-300">
                Confirm Approval for {expenseNo}
              </p>
              <p className="mt-1">
                By approving this expense, its amount will be officially added to the project actual cost ledger and reflected across financial reports.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleApproveSubmit}
              className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? "Approving..." : "✓ Yes, Approve Expense"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 2. REJECT CONFIRMATION MODAL ────────────────────────────── */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => !loading && setIsRejectOpen(false)}
        title="Reject Expense Request"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-900 dark:text-red-200">
            <AlertOctagon size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-800 dark:text-red-300">
                Reject Expense {expenseNo}
              </p>
              <p className="mt-1">
                This expense will be rejected and excluded from actual project costs. If this was a Transport entry, the transport record will be marked as Cancelled.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Rejection Reason / Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Invalid receipt attached, duplicate entry, unauthorized amount..."
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleRejectSubmit}
              className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? "Rejecting..." : "✕ Confirm Rejection"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
