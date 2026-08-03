"use server";

// ============================================================
// src/app/(Main)/admin/stock-receive/actions.ts
// Server Actions for StockReceive CRUD + Confirm workflow.
//
// Confirm workflow (atomic Prisma transaction):
//   1. Set status → CONFIRMED
//   2. Per item: create StockBatch
//   3. Per item: create StockMovement (IN, STOCK_RECEIVE)
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stockReceiveSchema, updateStockReceiveSchema } from "@/lib/validations/stock-receive";
import type { ActionState } from "@/types/auth";
import type { StockReceiveStatus } from "@/generated/prisma/client";

const STOCK_RECEIVE_PATH = "/admin/stock-receive";

// ── Types ────────────────────────────────────────────────────

export type StockReceiveItem = {
  id: number;
  stockReceiveId: number;
  inventoryId: number;
  qty: number;
  unitCost: number;
  batchNo: string | null;
  expiryDate: Date | null;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    unit: string;
  };
};

export type StockReceiveRow = {
  id: number;
  receiveNo: string;
  supplierId: number;
  receiveDate: Date;
  referenceNo: string | null;
  remarks: string | null;
  status: StockReceiveStatus;
  receivedBy: string;
  createdAt: Date;
  updatedAt: Date;
  supplier: { id: number; company: string };
  receivedByUser: { id: string; name: string };
  items: StockReceiveItem[];
};

export type StockReceiveFilterParams = {
  search?: string;
  supplierId?: number;
  status?: StockReceiveStatus;
  dateFrom?: string;
  dateTo?: string;
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint")) {
    if (msg.includes("receiveNo")) return "Receive number already exists.";
  }
  console.error("[StockReceive Error]", err);
  return "An unexpected error occurred.";
}

const receiveSelect = {
  id: true,
  receiveNo: true,
  supplierId: true,
  receiveDate: true,
  referenceNo: true,
  remarks: true,
  status: true,
  receivedBy: true,
  createdAt: true,
  updatedAt: true,
  supplier: { select: { id: true, company: true } },
  receivedByUser: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      stockReceiveId: true,
      inventoryId: true,
      qty: true,
      unitCost: true,
      batchNo: true,
      expiryDate: true,
      inventory: {
        select: { id: true, itemCode: true, name: true, unit: true },
      },
    },
  },
} as const;

// ── Queries ──────────────────────────────────────────────────

export async function getStockReceives(
  filters?: StockReceiveFilterParams
): Promise<StockReceiveRow[]> {
  const where: Record<string, unknown> = {};

  if (filters?.supplierId) where.supplierId = filters.supplierId;
  if (filters?.status) where.status = filters.status;

  if (filters?.dateFrom || filters?.dateTo) {
    where.receiveDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {}),
    };
  }

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { receiveNo: { contains: s, mode: "insensitive" } },
      { referenceNo: { contains: s, mode: "insensitive" } },
      { supplier: { company: { contains: s, mode: "insensitive" } } },
    ];
  }

  return prisma.stockReceive.findMany({
    where,
    select: receiveSelect,
    orderBy: { createdAt: "desc" },
  }) as Promise<StockReceiveRow[]>;
}

export async function getStockReceiveById(id: number): Promise<StockReceiveRow | null> {
  return prisma.stockReceive.findUnique({
    where: { id },
    select: receiveSelect,
  }) as Promise<StockReceiveRow | null>;
}

/** Generate next receive number e.g. GRN-20260803-001 */
export async function generateReceiveNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `GRN-${dateStr}-`;
  const last = await prisma.stockReceive.findFirst({
    where: { receiveNo: { startsWith: prefix } },
    orderBy: { receiveNo: "desc" },
    select: { receiveNo: true },
  });
  const seq = last ? parseInt(last.receiveNo.slice(-3)) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// ── Mutations ────────────────────────────────────────────────

export async function createStockReceive(
  formData: unknown
): Promise<ActionState<{ id: number }>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  const parsed = stockReceiveSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  try {
    const receive = await prisma.stockReceive.create({
      data: {
        receiveNo: data.receiveNo,
        supplierId: data.supplierId,
        receiveDate: new Date(data.receiveDate),
        referenceNo: data.referenceNo ?? null,
        remarks: data.remarks ?? null,
        status: "DRAFT",
        receivedBy: session.user.id,
        items: {
          create: data.items.map((item) => ({
            inventoryId: item.inventoryId,
            qty: item.qty,
            unitCost: item.unitCost,
            batchNo: item.batchNo ?? null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath(STOCK_RECEIVE_PATH);
    return { success: true, message: "Stock Receive created successfully.", data: { id: receive.id } };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function updateStockReceive(
  formData: unknown
): Promise<ActionState<{ id: number }>> {
  const parsed = updateStockReceiveSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  const existing = await prisma.stockReceive.findUnique({
    where: { id: data.id },
    select: { status: true },
  });

  if (!existing) return { success: false, message: "Stock Receive not found." };
  if (existing.status !== "DRAFT")
    return { success: false, message: "Only DRAFT receive orders can be edited." };

  try {
    await prisma.$transaction(async (tx) => {
      // Replace all items
      await tx.stockReceiveItem.deleteMany({ where: { stockReceiveId: data.id } });

      await tx.stockReceive.update({
        where: { id: data.id },
        data: {
          receiveNo: data.receiveNo,
          supplierId: data.supplierId,
          receiveDate: new Date(data.receiveDate),
          referenceNo: data.referenceNo ?? null,
          remarks: data.remarks ?? null,
          items: {
            create: data.items.map((item) => ({
              inventoryId: item.inventoryId,
              qty: item.qty,
              unitCost: item.unitCost,
              batchNo: item.batchNo ?? null,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            })),
          },
        },
      });
    });

    revalidatePath(STOCK_RECEIVE_PATH);
    return { success: true, message: "Stock Receive updated successfully.", data: { id: data.id } };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * CONFIRM a StockReceive — atomic transaction:
 * 1. status → CONFIRMED
 * 2. Create StockBatch per item
 * 3. Create StockMovement(IN) per item
 */
export async function confirmStockReceive(id: number): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  const receive = await prisma.stockReceive.findUnique({
    where: { id },
    select: {
      status: true,
      receiveDate: true,
      items: {
        select: {
          id: true,
          inventoryId: true,
          qty: true,
          unitCost: true,
          batchNo: true,
          expiryDate: true,
          inventory: { select: { rackLocation: true, warehouse: true } },
        },
      },
    },
  });

  if (!receive) return { success: false, message: "Stock Receive not found." };
  if (receive.status !== "DRAFT")
    return { success: false, message: "Only DRAFT orders can be confirmed." };
  if (receive.items.length === 0)
    return { success: false, message: "Cannot confirm an empty receive order." };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.stockReceive.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      // 2 & 3. Create StockBatch + StockMovement per item
      for (const item of receive.items) {
        const batch = await tx.stockBatch.create({
          data: {
            inventoryId: item.inventoryId,
            stockReceiveItemId: item.id,
            batchNo: item.batchNo,
            receivedQty: item.qty,
            availableQty: item.qty,
            unitCost: item.unitCost,
            expiryDate: item.expiryDate,
            receiveDate: receive.receiveDate,
            rackLocation: item.inventory.rackLocation,
            warehouse: item.inventory.warehouse,
          },
          select: { id: true },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: item.inventoryId,
            stockBatchId: batch.id,
            qty: item.qty,
            movementType: "IN",
            referenceType: "STOCK_RECEIVE",
            referenceId: id,
            remarks: `Goods Receive — confirmed`,
            createdBy: session.user.id,
          },
        });
      }
    });

    revalidatePath(STOCK_RECEIVE_PATH);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/stock-batch");
    revalidatePath("/admin/stock-movement");
    return { success: true, message: "Stock Receive confirmed. Batches and movements created." };
  } catch (err) {
    console.error("[confirmStockReceive]", err);
    return { success: false, message: "Failed to confirm receive. Please try again." };
  }
}

export async function cancelStockReceive(id: number): Promise<ActionState> {
  const existing = await prisma.stockReceive.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) return { success: false, message: "Not found." };
  if (existing.status === "CONFIRMED")
    return { success: false, message: "Confirmed orders cannot be cancelled." };

  try {
    await prisma.stockReceive.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    revalidatePath(STOCK_RECEIVE_PATH);
    return { success: true, message: "Stock Receive cancelled." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
