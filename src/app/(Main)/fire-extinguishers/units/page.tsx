// ============================================================
// src/app/(Main)/fire-extinguishers/units/page.tsx
// Physical Fire Extinguisher Master List Page
// ============================================================

import React, { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { PhysicalUnitsClient } from "@/components/fire-extinguishers/PhysicalUnitsClient";
import ExtinguisherUnitsTableSkeleton from "@/components/fire-extinguishers/ExtinguisherUnitsTableSkeleton";
import { Flame, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Physical Units — Fire Extinguisher Management",
  description: "Catalogue and track individual fire extinguisher asset units.",
};

export default async function PhysicalUnitsPage() {
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();

  const userRole = session?.user?.role || "USER";
  const canManage = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || permissions.has("fire_extinguisher.manage");

  const [rawUnits, inventoryItems] = await Promise.all([
    prisma.fireExtinguisherUnit.findMany({
      include: {
        inventory: {
          select: { id: true, itemCode: true, name: true },
        },
        assignments: {
          where: { status: { in: ["ACTIVE", "UNDER_REFILL"] } },
          include: { project: true, customer: true },
          orderBy: { assignedDate: "desc" },
          take: 1,
        },
      },
      orderBy: { unitCode: "asc" },
    }),
    prisma.inventory.findMany({
      select: { id: true, itemCode: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const units = rawUnits.map((u) => ({
    ...u,
    manufactureDate: u.manufactureDate ? u.manufactureDate.toISOString() : null,
    expiryDate: u.expiryDate ? u.expiryDate.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation back */}
        <div>
          <Link
            href="/fire-extinguishers/assignments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Fire Extinguishers Overview
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <Flame size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  Physical Fire Extinguisher Units
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Master catalogue of individually tracked physical extinguishers and asset codes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Client UI */}
        <Suspense fallback={<ExtinguisherUnitsTableSkeleton />}>
          <PhysicalUnitsClient
            initialUnits={units as any}
            inventoryItems={inventoryItems}
            canManage={canManage}
          />
        </Suspense>
      </div>
    </div>
  );
}
