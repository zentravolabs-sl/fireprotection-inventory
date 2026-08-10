// ============================================================
// src/lib/services/staffService.ts
// Business Logic Layer for Project Staff Assignments
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  getProjectStaff,
  getProjectStaffById,
  findActiveProjectStaff,
  createProjectStaff,
  setLeadEngineerInStaff,
  updateProjectStaffRecord,
  releaseProjectStaffRecord,
  getProjectStaffCostSummary,
} from "@/lib/repositories/staffRepository";
import type {
  AssignStaffInput,
  UpdateStaffInput,
  ReleaseStaffInput,
} from "@/lib/validations/staff";

// ── Staff Assignment Services ────────────────────────────────────────────────

export async function getProjectStaffService(projectId: number) {
  return getProjectStaff(projectId);
}

export async function getProjectStaffByIdService(id: number) {
  return getProjectStaffById(id);
}

export async function assignProjectStaffService(data: AssignStaffInput) {
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new Error("Staff user not found.");
  if (!user.isActive) throw new Error("Cannot assign an inactive user.");

  if (data.role === "PROJECT_MANAGER") {
    if (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error(`User "${user.name}" has global role "${user.role}" and cannot be assigned as Project Manager.`);
    }
  } else if (data.role === "ENGINEER") {
    if (user.role !== "ENGINEER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error(`User "${user.name}" has global role "${user.role}" and cannot be assigned as Engineer.`);
    }
  }

  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new Error("Project not found.");

  const existingActive = await findActiveProjectStaff(data.projectId, data.userId);
  if (existingActive) {
    throw new Error(`User "${user.name}" is already actively assigned to this project.`);
  }

  if (data.role === "PROJECT_MANAGER" && data.isLead) {
    throw new Error("Project Manager cannot be designated as Lead Engineer.");
  }

  return createProjectStaff(data);
}

export async function setLeadEngineerStaffService(projectId: number, projectStaffId: number) {
  return setLeadEngineerInStaff(projectId, projectStaffId);
}

export async function updateProjectStaffService(data: UpdateStaffInput) {
  const { id, ...rest } = data;
  const staff = await prisma.projectStaff.findUnique({ where: { id } });
  if (!staff) throw new Error("Project staff record not found.");

  return updateProjectStaffRecord(id, rest);
}

export async function releaseProjectStaffService(data: ReleaseStaffInput) {
  const staff = await prisma.projectStaff.findUnique({ where: { id: data.projectStaffId } });
  if (!staff) throw new Error("Project staff record not found.");
  if (staff.status === "RELEASED") throw new Error("Staff member is already released.");

  return releaseProjectStaffRecord(data.projectStaffId, data.releasedDate);
}

// ── Cost Summary Service ─────────────────────────────────────────────────────

export async function getProjectStaffCostSummaryService(projectId: number) {
  return getProjectStaffCostSummary(projectId);
}
