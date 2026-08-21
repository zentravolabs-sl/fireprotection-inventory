// ============================================================
// src/app/(Main)/fire-extinguishers/customer-refills/[id]/page.tsx
// Customer Refill Job Detail Server Page
// ============================================================

import React from "react";
import { notFound } from "next/navigation";
import { getCustomerRefillByIdService } from "@/lib/services/customerRefillService";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import { CustomerRefillDetailClient } from "@/components/fire-extinguishers/CustomerRefillDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerRefillDetailPage({ params }: Props) {
  const { id } = await params;
  const refillId = Number(id);

  if (isNaN(refillId)) notFound();

  const permissions = await getCurrentUserPermissions();

  if (!permissions.has("customerRefills.view")) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-gray-500">
        You do not have permission to view this refill job.
      </div>
    );
  }

  const data = await getCustomerRefillByIdService(refillId);
  if (!data) notFound();

  // Serialize dates for client
  const serialized = {
    refill: {
      ...data.refill,
      receivedDate: data.refill.receivedDate.toISOString(),
      completedDate: data.refill.completedDate?.toISOString() ?? null,
      createdAt: data.refill.createdAt.toISOString(),
      updatedAt: data.refill.updatedAt.toISOString(),
      items: data.refill.items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      replacements: data.refill.replacements.map((r) => ({
        ...r,
        issuedDate: r.issuedDate.toISOString(),
        returnedDate: r.returnedDate?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    },
    stockMovements: data.stockMovements.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <CustomerRefillDetailClient
        data={serialized as any}
        userPermissions={Array.from(permissions)}
      />
    </div>
  );
}
