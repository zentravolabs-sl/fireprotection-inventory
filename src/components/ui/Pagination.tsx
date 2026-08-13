"use client";

// ============================================================
// src/components/ui/Pagination.tsx
// Reusable server-side pagination controls for tables.
// ============================================================

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit?: number;
  paramName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  limit = 5,
  paramName = "page",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalRecords === 0 || totalPages <= 1) {
    if (totalRecords > 0) {
      return (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing 1 to {totalRecords} of {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </span>
        </div>
      );
    }
    return null;
  }

  const startRecord = Math.min((currentPage - 1) * limit + 1, totalRecords);
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startRecord}</span> to{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{endRecord}</span> of{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalRecords}</span> record{totalRecords !== 1 ? "s" : ""}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        {getPageNumbers().map((pNum, idx) =>
          pNum === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={`page-${pNum}`}
              type="button"
              onClick={() => handlePageChange(pNum as number)}
              className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${
                currentPage === pNum
                  ? "bg-red-600 text-white border-red-600 font-semibold"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              {pNum}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
