// ============================================================
// src/app/(Main)/fire-extinguishers/deliveries/page.tsx
// Client Delivery Notes Management Page
// ============================================================

import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { ClientDeliveriesClient } from "@/components/fire-extinguishers/ClientDeliveriesClient";
import { Truck, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client Deliveries — Fire Extinguisher Management",
  description: "Direct client delivery notes and fire extinguisher unit dispatch.",
};

export default async function ClientDeliveriesPage() {
  const session = await getSession();
  const permissions = await getCurrentUserPermissions();

  const userRole = session?.user?.role || "USER";
  const canDeliver = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || permissions.has("fire_extinguisher.deliver");

  const [rawDeliveries, rawCustomers, rawProjects, rawSelectableUnits] = await Promise.all([
    prisma.deliveryNote.findMany({
      include: {
        customer: true,
        items: {
          include: {
            fireExtinguisherUnit: {
              include: { inventory: true },
            },
          },
        },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      orderBy: { companyName: "asc" },
    }),
    prisma.project.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: { id: true, projectCode: true, projectName: true, customerId: true },
      orderBy: { projectName: "asc" },
    }),
    // Fetch AVAILABLE units (warehouse stock) AND ASSIGNED units (already deployed)
    prisma.fireExtinguisherUnit.findMany({
      where: { status: { in: ["AVAILABLE", "ASSIGNED"] } },
      include: {
        inventory: {
          select: { name: true, itemCode: true, unit: true },
        },
        // Include active assignment info to show "already assigned to X" in the modal
        assignments: {
          where: { status: { in: ["ACTIVE", "UNDER_REFILL"] } },
          include: {
            customer: { select: { id: true, companyName: true } },
            project: { select: { id: true, projectCode: true, projectName: true } },
          },
          orderBy: { assignedDate: "desc" },
          take: 1,
        },
      },
      orderBy: [{ status: "asc" }, { unitCode: "asc" }],
    }),
  ]);


  const deliveries = rawDeliveries.map((d) => ({
    ...d,
    deliveryDate: d.deliveryDate.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    items: d.items.map((i) => ({
      ...i,
      fireExtinguisherUnit: {
        ...i.fireExtinguisherUnit,
        manufactureDate: i.fireExtinguisherUnit.manufactureDate ? i.fireExtinguisherUnit.manufactureDate.toISOString() : null,
        expiryDate: i.fireExtinguisherUnit.expiryDate ? i.fireExtinguisherUnit.expiryDate.toISOString() : null,
      },
    })),
  }));

  const availableUnits = rawSelectableUnits.map((u) => ({
    ...u,
    expiryDate: u.expiryDate ? u.expiryDate.toISOString() : null,
    assignments: u.assignments.map((a) => ({
      ...a,
      assignedDate: a.assignedDate.toISOString(),
      returnedDate: a.returnedDate ? a.returnedDate.toISOString() : null,
    })),
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
            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Client Delivery Notes
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Direct client delivery note dispatch, stock movement OUT, and customer unit assignments.
              </p>
            </div>
          </div>
        </div>

        <ClientDeliveriesClient
          initialDeliveries={deliveries as any}
          customers={rawCustomers as any}
          projects={rawProjects as any}
          availableUnits={availableUnits as any}
          canDeliver={canDeliver}
        />

      </div>
    </div>
  );
}
