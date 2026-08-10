// ============================================================
// src/lib/validations/staff.ts
// Zod Validation Schemas — Project Staff Management Module
// ============================================================

import { z } from "zod";

export const projectStaffRoleEnum = z.enum(["PROJECT_MANAGER", "ENGINEER"]);
export const projectStaffStatusEnum = z.enum(["ACTIVE", "RELEASED"]);
export const staffAttendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]);

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

// ── Attendance Validation ───────────────────────────────────────────────────

export const addAttendanceSchema = z.object({
  projectStaffId: z.number().int().positive("Project staff ID is required"),
  workDate: z.string().min(1, "Work date is required"),
  status: staffAttendanceStatusEnum,
  workedHours: z.number().min(0, "Worked hours cannot be negative").default(0),
  otHours: z.number().min(0, "OT hours cannot be negative").default(0),
  remarks: z.string().optional().nullable(),
});

export const updateAttendanceSchema = z.object({
  id: z.number().int().positive("Attendance record ID is required"),
  status: staffAttendanceStatusEnum,
  workedHours: z.number().min(0, "Worked hours cannot be negative").default(0),
  otHours: z.number().min(0, "OT hours cannot be negative").default(0),
  remarks: z.string().optional().nullable(),
});

// ── TypeScript Types ─────────────────────────────────────────────────────────

export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ReleaseStaffInput = z.infer<typeof releaseStaffSchema>;
export type AddAttendanceInput = z.infer<typeof addAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
