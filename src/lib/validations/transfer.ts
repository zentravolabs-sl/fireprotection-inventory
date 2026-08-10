// ============================================================
// src/lib/validations/transfer.ts
// Zod Validation Schemas for Project to Project Stock Transfers
// ============================================================

import { z } from "zod";

export const projectTransferItemSchema = z
  .object({
    inventoryId: z.number().int().positive().optional().nullable(),
    stockBatchId: z.number().int().positive().optional().nullable(),
    pipeCutPieceId: z.number().int().positive().optional().nullable(),
    toolId: z.number().int().positive().optional().nullable(),
    qty: z.number().positive("Quantity must be greater than 0."),
    unit: z.string().min(1, "Unit is required."),
    unitCost: z.number().min(0, "Unit cost cannot be negative.").default(0),
    remarks: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasInventory = data.inventoryId !== undefined && data.inventoryId !== null;
      const hasPipeCut = data.pipeCutPieceId !== undefined && data.pipeCutPieceId !== null;
      const hasTool = data.toolId !== undefined && data.toolId !== null;

      // Exactly one source item type must be specified
      const count = (hasInventory ? 1 : 0) + (hasPipeCut ? 1 : 0) + (hasTool ? 1 : 0);
      return count === 1;
    },
    {
      message: "Each transfer item must specify exactly one source: Inventory Material, Pipe Cut Piece, or Tool.",
      path: ["inventoryId"],
    }
  );

export const createProjectTransferSchema = z
  .object({
    fromProjectId: z.number().int().positive("Source project is required."),
    toProjectId: z.number().int().positive("Destination project is required."),
    transferDate: z.string().optional(),
    remarks: z.string().optional().nullable(),
    items: z.array(projectTransferItemSchema).min(1, "At least one item must be added to the transfer."),
  })
  .refine((data) => data.fromProjectId !== data.toProjectId, {
    message: "Source and destination projects must be different.",
    path: ["toProjectId"],
  });

export const projectTransferFilterSchema = z.object({
  search: z.string().optional(),
  fromProjectId: z.number().int().optional(),
  toProjectId: z.number().int().optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type CreateProjectTransferInput = z.infer<typeof createProjectTransferSchema>;
export type ProjectTransferItemInput = z.infer<typeof projectTransferItemSchema>;
export type ProjectTransferFilterInput = z.infer<typeof projectTransferFilterSchema>;
