"use server";

// ============================================================
// src/app/(Main)/admin/stock-movement/actions.ts
// Server Actions for Stock Movement History Ledger.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { MovementType, ReferenceType } from "@/generated/prisma/client";

export type StockMovementRow = {
  id: number;
  qty: number;
  movementType: MovementType;
  referenceType: ReferenceType;
  referenceId: number | null;
  remarks: string | null;
  createdAt: Date;
  inventoryId: number;
  stockBatchId: number;
  createdBy: string;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
  stockBatch: {
    id: number;
    batchNo: string | null;
  };
  createdByUser: {
    id: string;
    name: string;
  };
};

export type StockMovementFilterParams = {
  search?: string;
  inventoryId?: number;
  stockBatchId?: number;
  movementType?: MovementType;
  referenceType?: ReferenceType;
  dateFrom?: string;
  dateTo?: string;
};

export async function getStockMovements(
  filters?: StockMovementFilterParams
): Promise<StockMovementRow[]> {
  const where: Record<string, unknown> = {};

  if (filters?.inventoryId) where.inventoryId = filters.inventoryId;
  if (filters?.stockBatchId) where.stockBatchId = filters.stockBatchId;
  if (filters?.movementType) where.movementType = filters.movementType;
  if (filters?.referenceType) where.referenceType = filters.referenceType;

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {}),
    };
  }

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { inventory: { name: { contains: s, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: s, mode: "insensitive" } } },
      { stockBatch: { batchNo: { contains: s, mode: "insensitive" } } },
      { remarks: { contains: s, mode: "insensitive" } },
      { createdByUser: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  return prisma.stockMovement.findMany({
    where,
    select: {
      id: true,
      qty: true,
      movementType: true,
      referenceType: true,
      referenceId: true,
      remarks: true,
      createdAt: true,
      inventoryId: true,
      stockBatchId: true,
      createdBy: true,
      inventory: {
        select: {
          id: true,
          itemCode: true,
          name: true,
          unit: true,
        },
      },
      stockBatch: {
        select: {
          id: true,
          batchNo: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
