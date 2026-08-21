"use client";

// ============================================================
// src/components/fire-extinguishers/DeliveryNoteDetailActions.tsx
// Client-side action bar for the Delivery Note Detail Page.
// Handles: Print (opens print page), Download PDF (fetch blob),
//          Confirm Delivery (server action call).
// ============================================================

import React, { useState, useTransition } from "react";
import { Printer, Download, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { confirmDeliveryNoteAction } from "@/app/actions/fire-extinguishers";
import type { DeliveryStatus } from "@/generated/prisma/client";

interface DeliveryNoteDetailActionsProps {
  deliveryNoteId: number;
  deliveryNo: string;
  status: DeliveryStatus;
  canDeliver: boolean;
  /** Called after a successful confirm so the parent can refresh / update state. */
  onConfirmed?: () => void;
}

export function DeliveryNoteDetailActions({
  deliveryNoteId,
  deliveryNo,
  status,
  canDeliver,
  onConfirmed,
}: DeliveryNoteDetailActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConfirming, startConfirmTransition] = useTransition();

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.open(
      `/fire-extinguishers/deliveries/${deliveryNoteId}/print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/delivery-notes/${deliveryNoteId}/pdf`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Delivery-Note-${deliveryNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF. Please try again.",
        { position: "bottom-right", autoClose: 4000 }
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Confirm Delivery ────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!confirm(`Confirm and mark Delivery Note ${deliveryNo} as DELIVERED? This will update stock and assign units to the customer.`))
      return;

    startConfirmTransition(async () => {
      const res = await confirmDeliveryNoteAction(deliveryNoteId);
      if (res.success) {
        toast.success(res.message ?? "Delivery confirmed successfully!", {
          position: "bottom-right",
          autoClose: 4000,
        });
        onConfirmed?.();
        // Reload to reflect new status
        window.location.reload();
      } else {
        toast.error(res.message ?? "Failed to confirm delivery.", {
          position: "bottom-right",
          autoClose: 5000,
        });
      }
    });
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Print Button */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
        title="Open print preview in new tab"
      >
        <Printer size={14} />
        Print
      </button>

      {/* Download PDF Button */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isDownloading}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
        title="Download professional PDF"
      >
        {isDownloading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating PDF…
          </>
        ) : (
          <>
            <Download size={14} />
            Download PDF
          </>
        )}
      </button>

      {/* Confirm Delivery Button — only for DRAFT status with deliver permission */}
      {status === "DRAFT" && canDeliver && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          title="Confirm and mark as Delivered"
        >
          {isConfirming ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              Confirm Delivery
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Inline PDF Download button for use in the list table ─────────────────────
export function InlinePdfDownloadButton({
  deliveryNoteId,
  deliveryNo,
}: {
  deliveryNoteId: number;
  deliveryNo: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/delivery-notes/${deliveryNoteId}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Delivery-Note-${deliveryNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!", { position: "bottom-right", autoClose: 2500 });
    } catch {
      toast.error("PDF generation failed.", { position: "bottom-right", autoClose: 3000 });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      title="Download PDF"
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg transition-colors"
    >
      {isDownloading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      {isDownloading ? "…" : "PDF"}
    </button>
  );
}
