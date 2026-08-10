// ============================================================
// src/lib/validations/labour.ts
// Zod Validation Schemas — Labour Management Module
// ============================================================

import { z } from "zod";

// ── Labour Type ─────────────────────────────────────────────────────────────

export const createLabourTypeSchema = z.object({
  name: z.string().min(2, "Labour type name must be at least 2 characters"),
  description: z.string().optional().nullable(),
});

export const updateLabourTypeSchema = createLabourTypeSchema.extend({
  id: z.number().int().positive(),
});

// ── Labour Master ────────────────────────────────────────────────────────────

export const createLabourSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  labourTypeId: z.number({ message: "Labour type is required" }).int().positive(),
  nic: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  monthlySalary: z.number().min(0, "Salary cannot be negative").default(0),
});

export const updateLabourSchema = createLabourSchema.extend({
  id: z.number().int().positive(),
});

// ── Project Labour Assignment ────────────────────────────────────────────────

export const assignLabourSchema = z.object({
  projectId: z.number().int().positive(),
  labourId: z.number().int().positive("Select a labour"),
  labourCost: z.number().min(0, "Labour cost cannot be negative").default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const updateProjectLabourSchema = z.object({
  id: z.number().int().positive(),
  labourCost: z.number().min(0, "Labour cost cannot be negative"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const releaseLabourSchema = z.object({
  projectLabourId: z.number().int().positive(),
});

// ── Overtime (OT) ────────────────────────────────────────────────────────────

export const logOTSchema = z.object({
  projectLabourId: z.number().int().positive("Select an assigned labour"),
  otDate: z.string().min(1, "OT date is required"),
  otHours: z.number().positive("OT hours must be greater than 0"),
  otRatePerHour: z.number().positive("OT rate must be greater than 0"),
  remarks: z.string().optional().nullable(),
});

// ── Exported TypeScript Types ────────────────────────────────────────────────

export type CreateLabourTypeInput = z.infer<typeof createLabourTypeSchema>;
export type UpdateLabourTypeInput = z.infer<typeof updateLabourTypeSchema>;
export type CreateLabourInput = z.infer<typeof createLabourSchema>;
export type UpdateLabourInput = z.infer<typeof updateLabourSchema>;
export type AssignLabourInput = z.infer<typeof assignLabourSchema>;
export type UpdateProjectLabourInput = z.infer<typeof updateProjectLabourSchema>;
export type ReleaseLabourInput = z.infer<typeof releaseLabourSchema>;
export type LogOTInput = z.infer<typeof logOTSchema>;
