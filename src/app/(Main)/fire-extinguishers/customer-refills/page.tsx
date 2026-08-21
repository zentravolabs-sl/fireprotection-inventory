// ============================================================
// src/app/(Main)/fire-extinguishers/customer-refills/page.tsx
// Customer-Owned Fire Extinguisher Refills Master Page
// ============================================================

import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { CustomerRefillsClient } from "@/components/fire-extinguishers/CustomerRefillsClient";
import { Flame, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer Refills — Fire Guard ERP",
  description: "Manage customer-owned fire extinguisher refill jobs and temporary replacement stock.",
};

export default async function CustomerRefillsPage() {
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();

  if (!permissions.has("customerRefills.view")) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-gray-500">
        You do not have permission to view customer refill jobs.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link
            href="/fire-extinguishers/assignments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Fire Extinguishers Overview
          </Link>
        </div>

        {/* CustomerRefillsClient fetches data via server actions internally */}
        <CustomerRefillsClient />
      </div>
    </div>
  );
}
