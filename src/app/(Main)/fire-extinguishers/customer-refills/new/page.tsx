// ============================================================
// src/app/(Main)/fire-extinguishers/customer-refills/new/page.tsx
// Create Customer Refill Job Server Page
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { CreateCustomerRefillClient } from "@/components/fire-extinguishers/CreateCustomerRefillClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Customer Refill Job — Fire Guard ERP",
  description: "Receive customer-owned fire extinguishers for refilling and issue temporary replacements.",
};

export default async function CreateCustomerRefillPage() {
  await requireSession();

  const [rawCustomers, rawInventory] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        address: true,
      },
      orderBy: { companyName: "asc" },
    }),
    prisma.inventory.findMany({
      select: {
        id: true,
        itemCode: true,
        name: true,
        unit: true,
        stockBatches: {
          select: { availableQty: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const inventoryItems = rawInventory.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    unit: item.unit,
    availableStock: item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <CreateCustomerRefillClient
        customers={rawCustomers}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}
