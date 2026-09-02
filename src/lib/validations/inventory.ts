// ============================================================
// src/lib/validations/inventory.ts
// Zod v4 schemas for the new clean Inventory master.
// Uses z.coerce to ensure z.input and z.output types match
// for seamless compatibility with React Hook Form + zodResolver.
// ============================================================

import { z } from "zod";

export const inventorySchema = z.object({
  itemCode: z
    .string()
    .min(1, "Item code is required.")
    .max(50, "Item code must be ≤ 50 characters.")
    .trim(),

  name: z
    .string()
    .min(2, "Item name must be at least 2 characters.")
    .max(150, "Item name must be ≤ 150 characters.")
    .trim(),

  categoryId: z.coerce
    .number({ message: "Category is required." })
    .int()
    .positive("Category is required."),

  subCategoryId: z.coerce
    .number({ message: "Sub-category is required." })
    .int()
    .positive("Sub-category is required."),

  brand: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),


  minStock: z.coerce
    .number({ message: "Minimum stock must be a number." })
    .min(0, "Minimum stock cannot be negative."),

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

  warehouse: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  defaultSellPrice: z.coerce
    .number({ message: "Default sell price must be a number." })
    .min(0, "Default sell price cannot be negative."),

  imageUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),

  expiryControlled: z.boolean().default(false),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

export const updateInventorySchema = inventorySchema.and(
  z.object({
    id: z.coerce.number().int().positive("Invalid inventory ID."),
  })
);

export type UpdateInventoryFormValues = z.infer<typeof updateInventorySchema>;
