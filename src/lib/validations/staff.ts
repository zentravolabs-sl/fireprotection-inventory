// ============================================================
// src/lib/validations/staff.ts
// Zod Validation Schemas — Project Staff Management Module
// ============================================================

import { z } from "zod";

export const projectStaffRoleEnum = z.enum(["PROJECT_MANAGER", "ENGINEER"]);
export const projectStaffStatusEnum = z.enum(["ACTIVE", "RELEASED"]);

// ── Assign Staff ─────────────────────────────────────────────────────────────

export const assignStaffSchema = z.object({
  projectId: z.number().int().positive("Project ID is required"),
  userId: z.string().min(1, "Select a staff member"),
  role: projectStaffRoleEnum,
  isLead: z.boolean().optional().default(false),
  assignedDate: z.string().min(1, "Assigned date is required"),
  remarks: z.string().optional().nullable(),
});

// ── Update Staff Record (Costs / Remarks) ────────────────────────────────────

export const updateStaffSchema = z.object({
  id: z.number().int().positive(),
  salaryCost: z.number().min(0, "Salary cost cannot be negative").default(0),
  otHours: z.number().min(0, "OT hours cannot be negative").default(0),
  otCost: z.number().min(0, "OT cost cannot be negative").default(0),
  remarks: z.string().optional().nullable(),
});

// ── Release Staff ────────────────────────────────────────────────────────────

export const releaseStaffSchema = z.object({
  projectStaffId: z.number().int().positive("Project staff ID is required"),
  releasedDate: z.string().min(1, "Released date is required"),
});

// ── TypeScript Types ─────────────────────────────────────────────────────────

export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ReleaseStaffInput = z.infer<typeof releaseStaffSchema>;
