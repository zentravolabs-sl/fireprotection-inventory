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
  ToolCode: z
    .string()
    .min(1, "Tool code is required.")
    .min(2, "Tool code must be at least 2 characters.")
    .max(50, "Tool code must be no more than 50 characters.")
    .trim(),

  Name: z
    .string()
    .min(1, "Tool name is required.")
    .min(2, "Tool name must be at least 2 characters.")
    .max(150, "Tool name must be no more than 150 characters.")
    .trim(),

  SerialNo: z
    .string()
    .min(1, "Serial number is required.")
    .max(100, "Serial number must be no more than 100 characters.")
    .trim(),

  Condition: ToolConditionEnum,

  Status: ToolStatusEnum,

  image_url: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (!val || val === "" ? null : val.trim())),
});

export type ToolFormValues = z.infer<typeof toolSchema>;

export const updateToolSchema = toolSchema.extend({
  Id: z.number({ message: "Invalid tool ID." }).int().positive(),
});

export type UpdateToolFormValues = z.infer<typeof updateToolSchema>;
