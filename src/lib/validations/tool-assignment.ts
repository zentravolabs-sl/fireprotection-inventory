// ============================================================
// src/lib/validations/tool-assignment.ts
// Zod v4 validation schemas for Tool Assignment Module.
// ============================================================

import { z } from "zod";

export const assignToolsSchema = z.object({
  projectId: z.coerce
    .number({ message: "Project ID is required." })
    .int()
    .positive(),

  engineerId: z
    .string()
    .min(1, "Engineer is required.")
    .trim(),

  assignDate: z
    .string()
    .min(1, "Assign date is required.")
    .transform((val) => new Date(val)),

  expectedReturnDate: z
    .string()
    .optional()
    .transform((val) => (val && val !== "" ? new Date(val) : undefined)),

  remarks: z
    .string()
    .max(500, "Remarks must be ≤ 500 characters.")
    .optional()
    .nullable()
    .transform((val) => val || null),

  toolIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Select at least one tool to assign."),
});

export type AssignToolsInput = z.infer<typeof assignToolsSchema>;

export const returnToolItemSchema = z.object({
  itemId: z.coerce
    .number({ message: "Invalid item ID." })
    .int()
    .positive(),

  condition: z.enum(["Good", "Damaged", "Lost"], {
    message: "Condition must be Good, Damaged, or Lost.",
  }),

  remarks: z
    .string()
    .max(500, "Remarks must be ≤ 500 characters.")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type ReturnToolItemInput = z.infer<typeof returnToolItemSchema>;
