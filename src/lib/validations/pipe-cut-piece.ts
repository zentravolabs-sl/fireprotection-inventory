// ============================================================
// src/lib/validations/pipe-cut-piece.ts
// Zod v4 schema for PipeCutPiece CRUD using z.coerce for numbers.
// ============================================================

import { z } from "zod";

export const PipeCutStatusEnum = z.enum(["AVAILABLE", "USED", "SCRAPPED"]);

export const pipeCutPieceSchema = z.object({
  inventoryId: z.coerce
    .number({ message: "Inventory item is required." })
    .int()
    .positive("Inventory item is required."),

  stockBatchId: z.coerce
    .number({ message: "Stock batch is required." })
    .int()
    .positive("Stock batch is required."),

  parentLength: z.coerce
    .number({ message: "Original length must be a number." })
    .positive("Original length must be greater than zero."),

  pieceLength: z.coerce
    .number({ message: "Piece length must be a number." })
    .positive("Piece length must be greater than zero."),

  unit: z.string().min(1, "Unit is required.").max(20).trim(),

  barcode: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  rackLocation: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  status: PipeCutStatusEnum.default("AVAILABLE"),

  remarks: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),
});

export type PipeCutPieceFormValues = z.infer<typeof pipeCutPieceSchema>;

export const updatePipeCutPieceSchema = pipeCutPieceSchema.and(
  z.object({
    id: z.coerce.number().int().positive(),
  })
);

export type UpdatePipeCutPieceFormValues = z.infer<typeof updatePipeCutPieceSchema>;
