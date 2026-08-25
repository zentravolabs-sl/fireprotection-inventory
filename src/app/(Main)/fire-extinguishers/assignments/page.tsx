// ============================================================
// src/app/(Main)/fire-extinguishers/assignments/page.tsx
// Unified Fire Extinguisher Assignments Management Page
// ============================================================

import React, { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { AssignmentsClient } from "@/components/fire-extinguishers/AssignmentsClient";
import ExtinguisherAssignmentsTableSkeleton from "@/components/fire-extinguishers/ExtinguisherAssignmentsTableSkeleton";
import { Flame, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assignments — Fire Extinguisher Management",
  description: "Track active and past fire extinguisher assignments for projects and direct clients.",
};

export default async function FireExtinguisherAssignmentsPage() {
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();

  const userRole = session?.user?.role || "USER";
  const canAssign = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || permissions.has("fire_extinguisher.assign");
  const canReturn = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || permissions.has("fire_extinguisher.return");

  const [rawAssignments, rawProjects, rawCustomers, rawAvailableUnits] = await Promise.all([
    prisma.fireExtinguisherAssignment.findMany({
      include: {
        fireExtinguisherUnit: {
          include: { inventory: true },
        },
        project: { select: { id: true, projectName: true, projectCode: true } },
        customer: { select: { id: true, companyName: true } },
      },
      orderBy: { assignedDate: "desc" },
    }),
    prisma.project.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: { id: true, projectCode: true, projectName: true },
      orderBy: { projectName: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.fireExtinguisherUnit.findMany({
      where: { status: "AVAILABLE" },
      include: { inventory: { select: { name: true, itemCode: true } } },
      orderBy: { unitCode: "asc" },
    }),
  ]);

  const assignments = rawAssignments.map((a) => ({
    ...a,
    assignedDate: a.assignedDate.toISOString(),
    returnedDate: a.returnedDate ? a.returnedDate.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Fire Extinguisher Assignments
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track active and past fire extinguisher unit locations across Project Sites and Direct Clients.
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<ExtinguisherAssignmentsTableSkeleton />}>
          <AssignmentsClient
            initialAssignments={assignments as any}
            projects={rawProjects}
            customers={rawCustomers}
            availableUnits={rawAvailableUnits as any}
            canAssign={canAssign}
            canReturn={canReturn}
          />
        </Suspense>
      </div>
    </div>
  );
}
