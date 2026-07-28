// ============================================================
// src/lib/validations/subcategory.ts
// Zod v4 validation schemas for the SubCategory CRUD module.
// ============================================================

import { z } from "zod";

// ── Create Schema ────────────────────────────────────────────

export const subCategorySchema = z.object({
  categoryId: z
    .number({ error: "Please select a category." })
    .int()
    .positive("Please select a valid category."),
  name: z
    .string()
    .min(1, "Sub-category name is required.")
    .min(2, "Sub-category name must be at least 2 characters.")
    .max(100, "Sub-category name must be no more than 100 characters.")
    .trim(),
});

export type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

// ── Update Schema (extends create with id) ───────────────────

export const updateSubCategorySchema = subCategorySchema.extend({
  id: z.number({ error: "Invalid sub-category ID." }).int().positive(),
});

export type UpdateSubCategoryFormValues = z.infer<typeof updateSubCategorySchema>;
