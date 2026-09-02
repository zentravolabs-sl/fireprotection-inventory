"use server";

// ============================================================
// src/app/(Main)/stock-movement/actions.ts
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
  page?: number;
  limit?: number;
};

export interface GetStockMovementsResult {
  movements: StockMovementRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getStockMovements(
  filters: StockMovementFilterParams = {}
): Promise<GetStockMovementsResult> {
  const where: Record<string, unknown> = {};

  if (filters.inventoryId) where.inventoryId = filters.inventoryId;
  if (filters.stockBatchId) where.stockBatchId = filters.stockBatchId;
  if (filters.movementType) where.movementType = filters.movementType;
  if (filters.referenceType) where.referenceType = filters.referenceType;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {}),
    };
  }

  if (filters.search) {
    const s = filters.search.trim();
    where.OR = [
      { inventory: { name: { contains: s, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: s, mode: "insensitive" } } },
      { stockBatch: { batchNo: { contains: s, mode: "insensitive" } } },
      { remarks: { contains: s, mode: "insensitive" } },
      { createdByUser: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const page = Math.max(1, filters.page || 1);
  const limit = filters.limit || 5;

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
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
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    movements: movements as StockMovementRow[],
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}
