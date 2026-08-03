// ============================================================
// src/lib/validations/tool.ts
// Zod v4 validation schemas for Tool CRUD module.
// ============================================================

import { z } from "zod";

export const ToolConditionEnum = z.enum([
  "New",
  "Good",
  "Fair",
  "Damaged",
  "UnderRepair",
]);
export type ToolConditionType = z.infer<typeof ToolConditionEnum>;

export const ToolStatusEnum = z.enum([
  "Available",
  "InUse",
  "Maintenance",
  "Lost",
  "Retired",
]);
export type ToolStatusType = z.infer<typeof ToolStatusEnum>;

export const toolSchema = z.object({
  toolCode: z
    .string()
    .min(1, "Tool code is required.")
    .min(2, "Tool code must be at least 2 characters.")
    .max(50, "Tool code must be no more than 50 characters.")
    .trim(),

  name: z
    .string()
    .min(1, "Tool name is required.")
    .min(2, "Tool name must be at least 2 characters.")
    .max(150, "Tool name must be no more than 150 characters.")
    .trim(),

  serialNo: z
    .string()
    .min(1, "Serial number is required.")
    .max(100, "Serial number must be no more than 100 characters.")
    .trim(),

  condition: ToolConditionEnum,

  status: ToolStatusEnum,

  imageUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((val) => (!val || val === "" ? null : val.trim())),
});

export type ToolFormValues = z.infer<typeof toolSchema>;

export const updateToolSchema = toolSchema.extend({
  id: z.coerce.number({ message: "Invalid tool ID." }).int().positive(),
});

export type UpdateToolFormValues = z.infer<typeof updateToolSchema>;
