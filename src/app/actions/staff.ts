"use server";

// ============================================================
// src/app/actions/staff.ts
// Server Actions for the Project Staff Management Module.
// Protected by role-based authorization.
// ============================================================

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth/authorization";
import {
  assignStaffSchema,
  updateStaffSchema,
  releaseStaffSchema,
} from "@/lib/validations/staff";
import {
  assignProjectStaffService,
  setLeadEngineerStaffService,
  updateProjectStaffService,
  releaseProjectStaffService,
} from "@/lib/services/staffService";

// ── Assign Staff Action ──────────────────────────────────────────────────────

export async function assignProjectStaffAction(data: {
  projectId: number;
  userId: string;
  role: "PROJECT_MANAGER" | "ENGINEER";
  isLead?: boolean;
  assignedDate: string;
  remarks?: string | null;
}) {
  try {
    await requireAnyRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);

    const parsed = assignStaffSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid input data" };
    }

    const result = await assignProjectStaffService(parsed.data);
    revalidatePath(`/dashboard/projects/${data.projectId}`);
    return {
      success: true,
      message: `Staff member assigned to project as ${result.role}.`,
      data: result,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign staff" };
  }
}

// ── Set Lead Engineer Action ─────────────────────────────────────────────────

export async function setLeadEngineerStaffAction(projectStaffId: number, projectId: number) {
  try {
    await requireAnyRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);

    const result = await setLeadEngineerStaffService(projectId, projectStaffId);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return {
      success: true,
      message: `${result.user.name} designated as Lead Engineer.`,
      data: result,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to set lead engineer" };
  }
}

// ── Update Staff Record Action (Financials / Remarks) ───────────────────────

export async function updateProjectStaffAction(data: {
  id: number;
  salaryCost: number;
  otHours: number;
  otCost: number;
  remarks?: string | null;
}, projectId: number) {
  try {
    await requireAnyRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);

    const parsed = updateStaffSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid input data" };
    }

    const result = await updateProjectStaffService(parsed.data);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return {
      success: true,
      message: "Staff financial costs updated successfully.",
      data: result,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update staff cost" };
  }
}

// ── Release Staff Action ─────────────────────────────────────────────────────

export async function releaseProjectStaffAction(data: {
  projectStaffId: number;
  releasedDate: string;
}, projectId: number) {
  try {
    await requireAnyRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);

    const parsed = releaseStaffSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid input data" };
    }

    const result = await releaseProjectStaffService(parsed.data);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return {
      success: true,
      message: `Staff member released from project.`,
      data: result,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to release staff" };
  }
}
