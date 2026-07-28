// ============================================================
// src/lib/validations/category.ts
// Zod v4 validation schemas for the Category CRUD module.
// ============================================================

import { z } from "zod";

// ── Create Schema ────────────────────────────────────────────

export const categorySchema = z.object({
  categoryName: z
    .string()
    .min(1, "Category name is required.")
    .min(2, "Category name must be at least 2 characters.")
    .max(100, "Category name must be no more than 100 characters.")
    .trim(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// ── Update Schema (extends create with id) ───────────────────

export const updateCategorySchema = categorySchema.extend({
  id: z.number({ error: "Invalid category ID." }).int().positive(),
});

export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;
