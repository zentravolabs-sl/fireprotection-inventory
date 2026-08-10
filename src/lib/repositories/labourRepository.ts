// ============================================================
// src/lib/repositories/labourRepository.ts
// Database access layer for the Labour Management Module.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { CreateLabourTypeInput, CreateLabourInput, AssignLabourInput } from "@/lib/validations/labour";

// ── Labour Type ─────────────────────────────────────────────────────────────

export async function getAllLabourTypes() {
  return prisma.labourType.findMany({
    include: {
      _count: { select: { labours: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getActiveLabourTypes() {
  return prisma.labourType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createLabourType(data: CreateLabourTypeInput) {
  return prisma.labourType.create({ data });
}

export async function updateLabourType(id: number, data: Partial<CreateLabourTypeInput>) {
  return prisma.labourType.update({ where: { id }, data });
}

export async function softDeleteLabourType(id: number) {
  // Check if any active labours reference this type
  const usageCount = await prisma.labour.count({
    where: { labourTypeId: id, isActive: true },
  });
  if (usageCount > 0) {
    throw new Error(
      `Cannot deactivate this Labour Type — ${usageCount} active labour(s) still use it.`
    );
  }
  return prisma.labourType.update({
    where: { id },
    data: { isActive: false },
  });
}

// ── Labour Master ────────────────────────────────────────────────────────────

export type LabourFilters = {
  search?: string;
  labourTypeId?: number;
  isActive?: boolean;
};

export async function getAllLabours(filters: LabourFilters = {}) {
  const where: any = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.labourTypeId) where.labourTypeId = filters.labourTypeId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { labourCode: { contains: filters.search, mode: "insensitive" } },
      { nic: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.labour.findMany({
    where,
    include: {
      labourType: { select: { id: true, name: true } },
      _count: { select: { projectLabours: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLabourById(id: number) {
  return prisma.labour.findUnique({
    where: { id },
    include: {
      labourType: true,
      projectLabours: {
        include: { project: { select: { id: true, projectCode: true, projectName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createLabour(data: CreateLabourInput & { labourCode: string }) {
  return prisma.labour.create({ data });
}

export async function updateLabour(id: number, data: Partial<CreateLabourInput>) {
  return prisma.labour.update({ where: { id }, data });
}

export async function deactivateLabour(id: number) {
  // Check if labour has any ACTIVE assignment
  const active = await prisma.projectLabour.count({
    where: { labourId: id, releaseStatus: "ACTIVE" },
  });
  if (active > 0) {
    throw new Error("Cannot deactivate labour with an active project assignment. Release them first.");
  }
  return prisma.labour.update({ where: { id }, data: { isActive: false } });
}

export async function reactivateLabour(id: number) {
  return prisma.labour.update({ where: { id }, data: { isActive: true } });
}

// Generate sequential labour code
export async function generateLabourCode(): Promise<string> {
  const last = await prisma.labour.findFirst({
    where: { labourCode: { startsWith: "LBR-" } },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return "LBR-0001";
  const num = parseInt(last.labourCode.split("-")[1] ?? "0", 10);
  return `LBR-${String(num + 1).padStart(4, "0")}`;
}

// ── Project Labour Assignment ────────────────────────────────────────────────

export async function getProjectLabours(projectId: number) {
  return prisma.projectLabour.findMany({
    where: { projectId },
    include: {
      labour: {
        include: { labourType: { select: { id: true, name: true } } },
      },
      assignedByUser: { select: { id: true, name: true } },
      overtimes: { orderBy: { otDate: "desc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createProjectLabour(
  data: AssignLabourInput & { assignedBy: string }
) {
  return prisma.projectLabour.create({
    data: {
      projectId: data.projectId,
      labourId: data.labourId,
      labourCost: data.labourCost,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      remarks: data.remarks ?? null,
      assignedBy: data.assignedBy,
    },
    include: {
      labour: { include: { labourType: true } },
    },
  });
}

export async function updateProjectLabourRecord(
  id: number,
  data: {
    labourCost?: number;
    startDate?: string | null;
    endDate?: string | null;
    remarks?: string | null;
  }
) {
  return prisma.projectLabour.update({
    where: { id },
    data: {
      labourCost: data.labourCost,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      remarks: data.remarks ?? null,
    },
  });
}

export async function releaseProjectLabour(id: number) {
  return prisma.projectLabour.update({
    where: { id },
    data: {
      releaseStatus: "RELEASED",
      releasedAt: new Date(),
    },
  });
}

// ── Labour OT ───────────────────────────────────────────────────────────────

export async function createLabourOT(data: {
  projectLabourId: number;
  otDate: string;
  otHours: number;
  otRatePerHour: number;
  otAmount: number;
  remarks?: string | null;
  createdBy: string;
}) {
  return prisma.labourOT.create({
    data: {
      projectLabourId: data.projectLabourId,
      otDate: new Date(data.otDate),
      otHours: data.otHours,
      otRatePerHour: data.otRatePerHour,
      otAmount: data.otAmount,
      remarks: data.remarks ?? null,
      createdBy: data.createdBy,
    },
  });
}

export async function deleteLabourOT(id: number) {
  return prisma.labourOT.delete({ where: { id } });
}

// ── Cost Summary ─────────────────────────────────────────────────────────────

export async function getProjectLabourCostSummary(projectId: number) {
  const rows = await prisma.projectLabour.findMany({
    where: { projectId },
    select: {
      id: true,
      labourCost: true,
      releaseStatus: true,
      overtimes: { select: { otAmount: true } },
    },
  });

  const totalLabourCost = rows.reduce((s, r) => s + r.labourCost, 0);
  const totalOTCost = rows.reduce(
    (s, r) => s + r.overtimes.reduce((ot, o) => ot + o.otAmount, 0),
    0
  );

  return {
    totalLabourCost,
    totalOTCost,
    totalCost: totalLabourCost + totalOTCost,
    headcount: rows.length,
    active: rows.filter((r) => r.releaseStatus === "ACTIVE").length,
    released: rows.filter((r) => r.releaseStatus === "RELEASED").length,
  };
}
