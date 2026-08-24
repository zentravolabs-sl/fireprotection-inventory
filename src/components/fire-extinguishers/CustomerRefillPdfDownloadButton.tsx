"use client";

// ============================================================
// src/components/fire-extinguishers/CustomerRefillPdfDownloadButton.tsx
// Download PDF button for Customer Refill Delivery Note
// ============================================================

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface Props {
  refillId: number;
  refillNo: string;
  variant?: "primary" | "secondary";
}

export function CustomerRefillPdfDownloadButton({ refillId, refillNo, variant = "primary" }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/customer-refills/${refillId}/pdf`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Refill-Delivery-Note-${refillNo}.pdf`;
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

  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
        title="Download PDF"
      >
        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {isDownloading ? "Downloading..." : "PDF"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
      title="Download PDF"
    >
      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {isDownloading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
