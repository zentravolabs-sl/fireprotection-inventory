"use server";

// ============================================================
// src/app/(Main)/admin/pipe-cut-pieces/actions.ts
// Server Actions for Pipe Cut Piece Management.
// Creating a cut piece appends a StockMovement (OUT, PIPE_CUT)
// in an atomic Prisma transaction.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { pipeCutPieceSchema, updatePipeCutPieceSchema } from "@/lib/validations/pipe-cut-piece";
import type { ActionState } from "@/types/auth";
import type { PipeCutStatus } from "@/generated/prisma/client";

const PIPE_CUT_PATH = "/admin/pipe-cut-pieces";

export type PipeCutPieceRow = {
  id: number;
  parentLength: number;
  pieceLength: number;
  unit: string;
  barcode: string | null;
  rackLocation: string | null;
  status: PipeCutStatus;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  inventoryId: number;
  stockBatchId: number;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
  };
  stockBatch: {
    id: number;
    batchNo: string | null;
  };
};

export type PipeCutPieceFilterParams = {
  search?: string;
  inventoryId?: number;
  stockBatchId?: number;
  status?: PipeCutStatus;
};

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") && msg.includes("barcode")) {
    return "A cut piece with this Barcode already exists.";
  }
  console.error("[PipeCutPiece Error]", err);
  return "An unexpected error occurred.";
}

export async function getPipeCutPieces(
  filters?: PipeCutPieceFilterParams
): Promise<PipeCutPieceRow[]> {
  const where: Record<string, unknown> = {};

  if (filters?.inventoryId) where.inventoryId = filters.inventoryId;
  if (filters?.stockBatchId) where.stockBatchId = filters.stockBatchId;
  if (filters?.status) where.status = filters.status;

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { barcode: { contains: s, mode: "insensitive" } },
      { inventory: { name: { contains: s, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: s, mode: "insensitive" } } },
      { stockBatch: { batchNo: { contains: s, mode: "insensitive" } } },
      { rackLocation: { contains: s, mode: "insensitive" } },
    ];
  }

  return prisma.pipeCutPiece.findMany({
    where,
    select: {
      id: true,
      parentLength: true,
      pieceLength: true,
      unit: true,
      barcode: true,
      rackLocation: true,
      status: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
      inventoryId: true,
      stockBatchId: true,
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
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPipeCutPiece(
  formData: unknown
): Promise<ActionState<PipeCutPieceRow>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  const parsed = pipeCutPieceSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  try {
    const cutPiece = await prisma.$transaction(async (tx) => {
      const piece = await tx.pipeCutPiece.create({
        data: {
          inventoryId: data.inventoryId,
          stockBatchId: data.stockBatchId,
          parentLength: data.parentLength,
          pieceLength: data.pieceLength,
          unit: data.unit,
          barcode: data.barcode ?? null,
          rackLocation: data.rackLocation ?? null,
          status: data.status,
          remarks: data.remarks ?? null,
        },
        select: {
          id: true,
          parentLength: true,
          pieceLength: true,
          unit: true,
          barcode: true,
          rackLocation: true,
          status: true,
          remarks: true,
          createdAt: true,
          updatedAt: true,
          inventoryId: true,
          stockBatchId: true,
          inventory: {
            select: { id: true, itemCode: true, name: true },
          },
          stockBatch: {
            select: { id: true, batchNo: true },
          },
        },
      });

      // Record inventory movement
      await tx.stockMovement.create({
        data: {
          inventoryId: data.inventoryId,
          stockBatchId: data.stockBatchId,
          qty: data.pieceLength,
          movementType: "OUT",
          referenceType: "PIPE_CUT",
          referenceId: piece.id,
          remarks: `Pipe cut off-cut generated (${data.pieceLength} ${data.unit})`,
          createdBy: session.user.id,
        },
      });

      return piece;
    });

    revalidatePath(PIPE_CUT_PATH);
    revalidatePath("/admin/stock-movement");
    return { success: true, message: "Pipe cut piece added successfully.", data: cutPiece };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function updatePipeCutPiece(
  formData: unknown
): Promise<ActionState<PipeCutPieceRow>> {
  const parsed = updatePipeCutPieceSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  try {
    const piece = await prisma.pipeCutPiece.update({
      where: { id: data.id },
      data: {
        inventoryId: data.inventoryId,
        stockBatchId: data.stockBatchId,
        parentLength: data.parentLength,
        pieceLength: data.pieceLength,
        unit: data.unit,
        barcode: data.barcode ?? null,
        rackLocation: data.rackLocation ?? null,
        status: data.status,
        remarks: data.remarks ?? null,
      },
      select: {
        id: true,
        parentLength: true,
        pieceLength: true,
        unit: true,
        barcode: true,
        rackLocation: true,
        status: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        inventoryId: true,
        stockBatchId: true,
        inventory: {
          select: { id: true, itemCode: true, name: true },
        },
        stockBatch: {
          select: { id: true, batchNo: true },
        },
      },
    });

    revalidatePath(PIPE_CUT_PATH);
    return { success: true, message: "Pipe cut piece updated successfully.", data: piece };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function deletePipeCutPiece(id: number): Promise<ActionState> {
  try {
    await prisma.pipeCutPiece.delete({ where: { id } });
    revalidatePath(PIPE_CUT_PATH);
    return { success: true, message: "Pipe cut piece deleted." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
