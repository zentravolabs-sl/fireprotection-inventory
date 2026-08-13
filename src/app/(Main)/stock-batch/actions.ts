"use server";

// ============================================================
// src/app/(Main)/stock-batch/actions.ts
// Server Actions for Stock Batch (Read-Only FIFO layer).
// ============================================================

import { prisma } from "@/lib/prisma";

export type StockBatchRow = {
  id: number;
  batchNo: string | null;
  receivedQty: number;
  availableQty: number;
  unitCost: number;
  expiryDate: Date | null;
  receiveDate: Date;
  rackLocation: string | null;
  warehouse: string | null;
  createdAt: Date;
  updatedAt: Date;
  inventoryId: number;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
  stockReceiveItem: {
    stockReceive: {
      receiveNo: string;
      supplier: {
        company: string;
      };
    };
  };
};

export type StockBatchFilterParams = {
  search?: string;
  inventoryId?: number;
  batchNo?: string;
  warehouse?: string;
  status?: "all" | "available" | "exhausted";
  page?: number;
  limit?: number;
};

export interface GetStockBatchesResult {
  batches: StockBatchRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getStockBatches(
  filters: StockBatchFilterParams = {}
): Promise<GetStockBatchesResult> {
  const where: Record<string, unknown> = {};

  if (filters.inventoryId) where.inventoryId = filters.inventoryId;
  if (filters.warehouse) where.warehouse = filters.warehouse;
  if (filters.batchNo) {
    where.batchNo = { contains: filters.batchNo.trim(), mode: "insensitive" };
  }

  if (filters.status === "available") {
    where.availableQty = { gt: 0 };
  } else if (filters.status === "exhausted") {
    where.availableQty = 0;
  }

  if (filters.search) {
    const s = filters.search.trim();
    where.OR = [
      { batchNo: { contains: s, mode: "insensitive" } },
      { inventory: { name: { contains: s, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: s, mode: "insensitive" } } },
      { warehouse: { contains: s, mode: "insensitive" } },
      { rackLocation: { contains: s, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, filters.page || 1);
  const limit = filters.limit || 5;

  const [total, batches] = await Promise.all([
    prisma.stockBatch.count({ where }),
    prisma.stockBatch.findMany({
      where,
      select: {
        id: true,
        batchNo: true,
        receivedQty: true,
        availableQty: true,
        unitCost: true,
        expiryDate: true,
        receiveDate: true,
        rackLocation: true,
        warehouse: true,
        createdAt: true,
        updatedAt: true,
        inventoryId: true,
        inventory: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            unit: true,
          },
        },
        stockReceiveItem: {
          select: {
            stockReceive: {
              select: {
                receiveNo: true,
                supplier: {
                  select: {
                    company: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ receiveDate: "asc" }, { id: "asc" }], // FIFO ordering
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    batches: batches as StockBatchRow[],
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

export async function getStockBatchesByInventoryId(inventoryId: number): Promise<StockBatchRow[]> {
  const res = await getStockBatches({ inventoryId, status: "available", limit: 1000 });
  return res.batches;
}
