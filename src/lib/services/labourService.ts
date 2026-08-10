// ============================================================
// src/lib/services/labourService.ts
// Business logic layer for the Labour Management Module.
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  getAllLabourTypes,
  getActiveLabourTypes,
  createLabourType,
  updateLabourType,
  softDeleteLabourType,
  getAllLabours,
  getLabourById,
  createLabour,
  updateLabour,
  deactivateLabour,
  reactivateLabour,
  generateLabourCode,
  getProjectLabours,
  createProjectLabour,
  updateProjectLabourRecord,
  releaseProjectLabour,
  createLabourOT,
  deleteLabourOT,
  getProjectLabourCostSummary,
  type LabourFilters,
} from "@/lib/repositories/labourRepository";
import type {
  CreateLabourTypeInput,
  UpdateLabourTypeInput,
  CreateLabourInput,
  UpdateLabourInput,
  AssignLabourInput,
  UpdateProjectLabourInput,
  LogOTInput,
} from "@/lib/validations/labour";

// ── Labour Type Services ─────────────────────────────────────────────────────

export async function getAllLabourTypesService() {
  return getAllLabourTypes();
}

export async function getActiveLabourTypesService() {
  return getActiveLabourTypes();
}

export async function createLabourTypeService(data: CreateLabourTypeInput) {
  const exists = await prisma.labourType.findUnique({ where: { name: data.name } });
  if (exists) {
    throw new Error(`Labour type "${data.name}" already exists.`);
  }
  return createLabourType(data);
}

export async function updateLabourTypeService(data: UpdateLabourTypeInput) {
  const { id, ...rest } = data;
  const conflict = await prisma.labourType.findFirst({
    where: { name: rest.name, NOT: { id } },
  });
  if (conflict) throw new Error(`Labour type "${rest.name}" already exists.`);
  return updateLabourType(id, rest);
}

export async function deleteLabourTypeService(id: number) {
  return softDeleteLabourType(id);
}

export async function restoreLabourTypeService(id: number) {
  return updateLabourType(id, { isActive: true } as any);
}

// ── Labour Master Services ────────────────────────────────────────────────────

export async function getAllLaboursService(filters?: LabourFilters) {
  return getAllLabours(filters);
}

export async function getLabourByIdService(id: number) {
  return getLabourById(id);
}

export async function createLabourService(data: CreateLabourInput) {
  const labourCode = await generateLabourCode();
  // NIC uniqueness check (if provided)
  if (data.nic) {
    const existing = await prisma.labour.findUnique({ where: { nic: data.nic } });
    if (existing) throw new Error(`NIC "${data.nic}" is already registered.`);
  }
  return createLabour({ ...data, labourCode });
}

export async function updateLabourService(id: number, data: UpdateLabourInput) {
  // NIC uniqueness check (if provided and changed)
  if (data.nic) {
    const existing = await prisma.labour.findFirst({
      where: { nic: data.nic, NOT: { id } },
    });
    if (existing) throw new Error(`NIC "${data.nic}" is already registered.`);
  }
  return updateLabour(id, data);
}

export async function deactivateLabourService(id: number) {
  return deactivateLabour(id);
}

export async function reactivateLabourService(id: number) {
  return reactivateLabour(id);
}

// ── Project Labour Assignment Services ──────────────────────────────────────

export async function getProjectLaboursService(projectId: number) {
  return getProjectLabours(projectId);
}

export async function assignLabourService(data: AssignLabourInput, actorId: string) {
  // Check labour exists and is active
  const labour = await prisma.labour.findUnique({ where: { id: data.labourId } });
  if (!labour) throw new Error("Labour not found.");
  if (!labour.isActive) throw new Error("Cannot assign an inactive labour.");

  // Enforce exclusivity: labour must not have ANY active ProjectLabour assignment (across all projects)
  const existingActive = await prisma.projectLabour.findFirst({
    where: {
      labourId: data.labourId,
      releaseStatus: "ACTIVE",
    },
    include: {
      project: { select: { projectCode: true, projectName: true } },
    },
  });

  if (existingActive) {
    throw new Error(
      `This labour is already assigned to project ${existingActive.project.projectCode} — ${existingActive.project.projectName}. ` +
        `Release them first before assigning to another project.`
    );
  }

  // Check project exists
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new Error("Project not found.");

  return createProjectLabour({ ...data, assignedBy: actorId });
}

export async function updateLabourAssignmentService(
  data: UpdateProjectLabourInput,
  actorId: string
) {
  const { id, ...rest } = data;
  const pl = await prisma.projectLabour.findUnique({ where: { id } });
  if (!pl) throw new Error("Assignment not found.");
  return updateProjectLabourRecord(id, rest);
}

export async function releaseLabourService(projectLabourId: number) {
  const pl = await prisma.projectLabour.findUnique({ where: { id: projectLabourId } });
  if (!pl) throw new Error("Assignment not found.");
  if (pl.releaseStatus === "RELEASED") throw new Error("Labour is already released.");
  return releaseProjectLabour(projectLabourId);
}

// ── OT Services ──────────────────────────────────────────────────────────────

export async function logOTService(data: LogOTInput, actorId: string) {
  const pl = await prisma.projectLabour.findUnique({ where: { id: data.projectLabourId } });
  if (!pl) throw new Error("Assignment not found.");

  const otAmount = parseFloat((data.otHours * data.otRatePerHour).toFixed(2));

  return createLabourOT({
    projectLabourId: data.projectLabourId,
    otDate: data.otDate,
    otHours: data.otHours,
    otRatePerHour: data.otRatePerHour,
    otAmount,
    remarks: data.remarks,
    createdBy: actorId,
  });
}

export async function deleteOTService(otId: number) {
  const ot = await prisma.labourOT.findUnique({ where: { id: otId } });
  if (!ot) throw new Error("OT record not found.");
  return deleteLabourOT(otId);
}

// ── Cost Summary Service ──────────────────────────────────────────────────────

export async function getProjectLabourCostSummaryService(projectId: number) {
  return getProjectLabourCostSummary(projectId);
}
