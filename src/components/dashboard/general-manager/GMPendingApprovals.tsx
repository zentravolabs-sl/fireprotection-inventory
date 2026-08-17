"use client";

// ============================================================
// src/components/dashboard/general-manager/GMPendingApprovals.tsx
// Management Action Queue: Pending Approvals.
// ============================================================

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { GMPendingApprovalsData } from "@/lib/services/generalManagerDashboardService";

interface GMPendingApprovalsProps {
  data: GMPendingApprovalsData;
}

export function GMPendingApprovals({ data }: GMPendingApprovalsProps) {
  const items = [
    {
      label: "Project Approvals",
      count: data.projectApprovals,
      href: "/projects",
    },
    {
      label: "Budget Approvals",
      count: data.budgetApprovals,
      href: "/cost-approvals",
    },
    {
      label: "Purchase Approvals",
      count: data.materialApprovals,
      href: "/material-requests",
    },
    {
      label: "Payment Approvals",
      count: data.paymentApprovals,
      href: "/cost-approvals",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Pending Approvals
            </h3>
          </div>
          <Link
            href="/cost-approvals"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All Approvals <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Action items awaiting management review and authorization
        </p>

        {data.totalPending === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            ✓ No pending approvals
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="p-3.5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Click to review
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                    item.count > 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {item.count} Pending
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
