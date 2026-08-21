// ============================================================
// src/app/(Main)/fire-extinguishers/refills/page.tsx
// Fire Extinguisher Refill Management Page
// ============================================================

import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { RefillManagementClient } from "@/components/fire-extinguishers/RefillManagementClient";
import { RefreshCw, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refill Management — Fire Extinguisher Management",
  description: "Track fire extinguisher refills, service history, and temporary replacement units.",
};

export default async function RefillsPage() {
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();

  const userRole = session?.user?.role || "USER";
  const canRefill = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || permissions.has("fire_extinguisher.refill");

  const [rawRefills, rawActiveAssignments, rawAvailableReplacements] = await Promise.all([
    prisma.extinguisherRefill.findMany({
      include: {
        fireExtinguisherUnit: {
          include: { inventory: true },
        },
        assignment: {
          include: { project: true, customer: true },
        },
        replacementUnit: {
          include: { inventory: true },
        },
      },
      orderBy: { receivedDate: "desc" },
    }),
    prisma.fireExtinguisherAssignment.findMany({
      where: { status: "ACTIVE" },
      include: {
        fireExtinguisherUnit: {
          include: { inventory: true },
        },
        project: { select: { id: true, projectName: true, projectCode: true } },
        customer: { select: { id: true, companyName: true } },
      },
      orderBy: { assignedDate: "desc" },
    }),

    prisma.fireExtinguisherUnit.findMany({
      where: { status: "AVAILABLE" },
      include: { inventory: true },
      orderBy: { unitCode: "asc" },
    }),
  ]);

  const refills = rawRefills.map((r) => ({
    ...r,
    receivedDate: r.receivedDate.toISOString(),
    completedDate: r.completedDate ? r.completedDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600/10 border border-amber-600/20 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <RefreshCw size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Refill & Service Management
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track active refills, temporary replacement dispatch, and completed extinguisher service records.
              </p>
            </div>
          </div>
        </div>

        <RefillManagementClient
          initialRefills={refills as any}
          activeAssignments={rawActiveAssignments as any}
          availableReplacements={rawAvailableReplacements as any}
          canRefill={canRefill}
        />
      </div>
    </div>
  );
}
