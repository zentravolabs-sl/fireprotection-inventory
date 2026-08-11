// ============================================================
// src/lib/validations/expiry.ts
// Zod schemas for Expiry Management module filtering, settings & actions.
// ============================================================

import { z } from "zod";

export const expiryStatusEnum = z.enum([
  "EXPIRED",
  "EXPIRING_SOON",
  "VALID",
  "NO_EXPIRY",
]);

export type ExpiryStatusType = z.infer<typeof expiryStatusEnum>;

export const expiryThresholdEnum = z.enum(["7", "14", "30", "60", "90"]);

export type ExpiryThresholdType = z.infer<typeof expiryThresholdEnum>;

export const expiryFilterSchema = z.object({
  status: expiryStatusEnum.optional(),
  expiryRange: expiryThresholdEnum.optional(), // 7, 14, 30, 60, 90 days
  categoryId: z.coerce.number().int().positive().optional(),
  subCategoryId: z.coerce.number().int().positive().optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  warehouse: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(15),
});

export type ExpiryFilterInput = z.infer<typeof expiryFilterSchema>;

export const updateExpirySettingSchema = z.object({
  thresholdDays: z.coerce
    .number()
    .int()
    .refine((v) => [7, 14, 30, 60, 90].includes(v), {
      message: "Threshold must be 7, 14, 30, 60, or 90 days.",
    }),
});

export type UpdateExpirySettingInput = z.infer<typeof updateExpirySettingSchema>;
