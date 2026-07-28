// ============================================================
// src/lib/validations/inventory.ts
// Zod v4 validation schemas for Inventory CRUD module.
// ============================================================

import { z } from "zod";

export const IssueLocationEnum = z.enum(["Warehouse", "Shop"]);
export type IssueLocationType = z.infer<typeof IssueLocationEnum>;

export const inventorySchema = z
  .object({
    ItemCode: z
      .string()
      .min(1, "Item code is required.")
      .max(50, "Item code must be no more than 50 characters.")
      .trim(),

    Name: z
      .string()
      .min(1, "Item name is required.")
      .min(2, "Item name must be at least 2 characters.")
      .max(150, "Item name must be no more than 150 characters.")
      .trim(),

    CategoryId: z
      .union([z.number(), z.string(), z.null()])
      .transform((val) => (!val || val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Category is required." })
          .int("Invalid Category ID.")
          .positive("Category is required.")
      ),

    SubCategoryId: z
      .union([z.number(), z.string(), z.null()])
      .transform((val) => (!val || val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Sub-category is required." })
          .int("Invalid Sub-Category ID.")
          .positive("Sub-category is required.")
      ),

    Brand: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val.trim())),

    Unit: z
      .string()
      .min(1, "Unit is required.")
      .max(20, "Unit must be no more than 20 characters.")
      .trim(),

    Qty: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Quantity must be a number." })
          .min(0, "Quantity cannot be negative.")
      ),

    MinStock: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Minimum stock must be a number." })
          .min(0, "Minimum stock cannot be negative.")
      ),

    Warehouse: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val.trim())),

    RackLocation: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val.trim())),

    BuyPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Buy price must be a number." })
          .min(0, "Buy price cannot be negative.")
      ),

    SellPrice: z
      .union([z.number(), z.string()])
      .transform((val) => (val === "" ? 0 : Number(val)))
      .pipe(
        z
          .number({ message: "Sell price must be a number." })
          .min(0, "Sell price cannot be negative.")
      ),

    SupplierId: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : Number(val))),

    Barcode: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val.trim())),

    ExpiryDate: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val)),

    image_url: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => (!val || val === "" ? null : val.trim())),

    issueLocation: IssueLocationEnum,
  })
  .refine((data) => data.SellPrice >= data.BuyPrice, {
    message: "Sell price cannot be lower than buy price.",
    path: ["SellPrice"],
  });

export type InventoryFormValues = z.infer<typeof inventorySchema>;

export const updateInventorySchema = inventorySchema.and(
  z.object({
    Id: z.number({ message: "Invalid inventory ID." }).int().positive(),
  })
);

export type UpdateInventoryFormValues = z.infer<typeof updateInventorySchema>;
