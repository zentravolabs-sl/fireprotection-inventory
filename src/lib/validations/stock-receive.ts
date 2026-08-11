// ============================================================
// src/lib/validations/stock-receive.ts
// Zod v4 schemas for StockReceive + StockReceiveItem.
// Uses z.coerce for numeric fields to ensure input/output parity with React Hook Form.
// ============================================================

import { z } from "zod";

export const stockReceiveItemSchema = z.object({
  id: z.coerce.number().int().positive().optional(),

  inventoryId: z.coerce
    .number({ message: "Item is required." })
    .int()
    .positive("Item is required."),

  qty: z.coerce
    .number({ message: "Quantity must be a number." })
    .positive("Quantity must be greater than zero."),

  unitCost: z.coerce
    .number({ message: "Unit cost must be a number." })
    .min(0, "Unit cost cannot be negative."),

  batchNo: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  manufactureDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),

  expiryDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),
}).refine(
  (data) => {
    if (data.manufactureDate && data.expiryDate) {
      const mDate = new Date(data.manufactureDate);
      const eDate = new Date(data.expiryDate);
      if (!isNaN(mDate.getTime()) && !isNaN(eDate.getTime())) {
        return eDate >= mDate;
      }
    }
    return true;
  },
  {
    message: "Expiry date cannot be before manufacture date.",
    path: ["expiryDate"],
  }
);

export type StockReceiveItemFormValues = z.infer<typeof stockReceiveItemSchema>;

export const stockReceiveSchema = z.object({
  receiveNo: z
    .string()
    .min(1, "Receive number is required.")
    .max(50)
    .trim(),

  supplierId: z.coerce
    .number({ message: "Supplier is required." })
    .int()
    .positive("Supplier is required."),

  receiveDate: z
    .string()
    .min(1, "Receive date is required."),

  referenceNo: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  remarks: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  items: z
    .array(stockReceiveItemSchema)
    .min(1, "At least one item is required."),
});

export type StockReceiveFormValues = z.infer<typeof stockReceiveSchema>;

export const updateStockReceiveSchema = stockReceiveSchema.and(
  z.object({
    id: z.coerce.number().int().positive(),
  })
);

export type UpdateStockReceiveFormValues = z.infer<typeof updateStockReceiveSchema>;
