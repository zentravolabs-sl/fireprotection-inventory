// ============================================================
// src/lib/validations/customer-refill.ts
// Zod Validation Schemas — Customer-Owned Fire Extinguisher Refills
// ============================================================

import { z } from "zod";

export const customerRefillItemSchema = z.object({
  extinguisherType: z.string().min(1, "Extinguisher type is required"),
  capacity: z.string().optional().nullable(),
  receivedQty: z.number().min(0.01, "Received quantity must be greater than 0"),
  notes: z.string().optional().nullable(),
});

export const customerRefillReplacementSchema = z.object({
  inventoryId: z.number().int().min(1, "Inventory item is required"),
  issuedQty: z.number().min(0.01, "Issued quantity must be greater than 0"),
  notes: z.string().optional().nullable(),
});

export const createCustomerRefillSchema = z.object({
  customerId: z.number().int().min(1, "Customer is required"),
  receivedDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "RECEIVED"]).optional().default("RECEIVED"),
  items: z
    .array(customerRefillItemSchema)
    .min(1, "At least one customer-owned extinguisher item is required"),
  hasReplacements: z.boolean().optional().default(false),
  replacements: z.array(customerRefillReplacementSchema).optional().default([]),
});

export const completeReturnSchema = z.object({
  refillId: z.number().int().min(1),
  returnedItems: z.array(
    z.object({
      itemId: z.number().int().min(1),
      returnQty: z.number().min(0),
    })
  ),
  returnedReplacements: z
    .array(
      z.object({
        replacementId: z.number().int().min(1),
        returnQty: z.number().min(0),
      })
    )
    .optional()
    .default([]),
  notes: z.string().optional().nullable(),
});
