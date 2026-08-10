// ============================================================
// src/lib/repositories/staffRepository.ts
// Database queries for Project Staff Assignments
// ============================================================

import { prisma } from "@/lib/prisma";
import type {
  ProjectStaffRole,
  ProjectStaffStatus,
} from "@/generated/prisma/client";
import type {
  AssignStaffInput,
  UpdateStaffInput,
} from "@/lib/validations/staff";

// ── Repository Queries ───────────────────────────────────────────────────────

export async function syncAndGetProjectStaff(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      projectManagerId: true,
      engineers: {
        select: { engineerId: true, isLead: true, assignedDate: true },
      },
    },
  });

  if (!project) return [];

  // Valid staff user IDs currently assigned to this project
  const validUserIds = new Set<string>();
  if (project.projectManagerId) validUserIds.add(project.projectManagerId);
  for (const eng of project.engineers) {
    validUserIds.add(eng.engineerId);
  }

  // 1. Fetch existing ProjectStaff records for this project
  const existingStaff = await prisma.projectStaff.findMany({
    where: { projectId },
    orderBy: { id: "asc" },
  });

  // 2. Identify duplicate records for the same (userId, role)
  const seenKeys = new Set<string>();
  const duplicateIdsToDelete: number[] = [];

  for (const ps of existingStaff) {
    const key = `${ps.userId}_${ps.role}`;
    if (seenKeys.has(key)) {
      duplicateIdsToDelete.push(ps.id);
    } else {
      seenKeys.add(key);
    }
  }

  if (duplicateIdsToDelete.length > 0) {
    await prisma.projectStaff.deleteMany({
      where: { id: { in: duplicateIdsToDelete } },
    });
  }

  // 3. Delete records for staff members who are no longer PM or assigned Engineer on this project
  const orphanIdsToDelete: number[] = [];
  for (const ps of existingStaff) {
    if (!duplicateIdsToDelete.includes(ps.id) && !validUserIds.has(ps.userId)) {
      orphanIdsToDelete.push(ps.id);
    }
  }

  if (orphanIdsToDelete.length > 0) {
    await prisma.projectStaff.deleteMany({
      where: { id: { in: orphanIdsToDelete } },
    });
  }

  // 4. Ensure Project Manager has a ProjectStaff record
  if (project.projectManagerId) {
    const pmStaff = await prisma.projectStaff.findFirst({
      where: { projectId, userId: project.projectManagerId, role: "PROJECT_MANAGER" },
    });
    if (!pmStaff) {
      await prisma.projectStaff.create({
        data: {
          projectId,
          userId: project.projectManagerId,
          role: "PROJECT_MANAGER",
          isLead: false,
          status: "ACTIVE",
          salaryCost: 0,
          otHours: 0,
          otCost: 0,
        },
      });
    }
  }

  // 5. Ensure assigned Engineers have ProjectStaff records
  for (const eng of project.engineers) {
    const engStaff = await prisma.projectStaff.findFirst({
      where: { projectId, userId: eng.engineerId, role: "ENGINEER" },
    });
    if (!engStaff) {
      await prisma.projectStaff.create({
        data: {
          projectId,
          userId: eng.engineerId,
          role: "ENGINEER",
          isLead: eng.isLead,
          assignedDate: eng.assignedDate || new Date(),
          status: "ACTIVE",
          salaryCost: 0,
          otHours: 0,
          otCost: 0,
        },
      });
    } else if (engStaff.isLead !== eng.isLead) {
      await prisma.projectStaff.update({
        where: { id: engStaff.id },
        data: { isLead: eng.isLead },
      });
    }
  }

  // 6. Return clean, deduplicated project staff
  return prisma.projectStaff.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { status: "asc" }, { assignedDate: "desc" }],
  });
}

export async function getProjectStaff(projectId: number) {
  return syncAndGetProjectStaff(projectId);
}

export async function getProjectStaffById(id: number) {
  return prisma.projectStaff.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      project: {
        select: { id: true, projectCode: true, projectName: true, status: true },
      },
    },
  });
}

export async function findActiveProjectStaff(projectId: number, userId: string) {
  return prisma.projectStaff.findFirst({
    where: {
      projectId,
      userId,
      status: "ACTIVE",
    },
  });
}

export async function createProjectStaff(data: AssignStaffInput) {
  const isLeadValue = data.role === "ENGINEER" ? Boolean(data.isLead) : false;

  return prisma.$transaction(async (tx) => {
    if (isLeadValue) {
      await tx.projectStaff.updateMany({
        where: { projectId: data.projectId, role: "ENGINEER", status: "ACTIVE" },
        data: { isLead: false },
      });
    }

    if (data.role === "PROJECT_MANAGER") {
      await tx.project.update({
        where: { id: data.projectId },
        data: { projectManagerId: data.userId },
      });
    }

    return tx.projectStaff.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        role: data.role as ProjectStaffRole,
        isLead: isLeadValue,
        assignedDate: new Date(data.assignedDate),
        remarks: data.remarks ?? null,
        status: "ACTIVE",
        salaryCost: 0,
        otHours: 0,
        otCost: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  });
}

export async function setLeadEngineerInStaff(projectId: number, projectStaffId: number) {
  return prisma.$transaction(async (tx) => {
    const targetStaff = await tx.projectStaff.findUnique({ where: { id: projectStaffId } });
    if (!targetStaff) throw new Error("Staff member not found.");
    if (targetStaff.role !== "ENGINEER") throw new Error("Project Manager cannot be designated as Lead Engineer.");
    if (targetStaff.status !== "ACTIVE") throw new Error("Only active staff can be designated as Lead Engineer.");

    await tx.projectStaff.updateMany({
      where: { projectId, role: "ENGINEER" },
      data: { isLead: false },
    });

    return tx.projectStaff.update({
      where: { id: projectStaffId },
      data: { isLead: true },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  });
}

export async function updateProjectStaffRecord(id: number, data: Omit<UpdateStaffInput, "id">) {
  return prisma.projectStaff.update({
    where: { id },
    data: {
      salaryCost: data.salaryCost,
      otHours: data.otHours,
      otCost: data.otCost,
      remarks: data.remarks ?? null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function releaseProjectStaffRecord(projectStaffId: number, releasedDate: string) {
  return prisma.projectStaff.update({
    where: { id: projectStaffId },
    data: {
      status: "RELEASED",
      isLead: false,
      releasedDate: new Date(releasedDate),
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

// ── Cost Summary Query ───────────────────────────────────────────────────────

export async function getProjectStaffCostSummary(projectId: number) {
  const staff = await prisma.projectStaff.findMany({
    where: { projectId },
    select: {
      role: true,
      salaryCost: true,
      otCost: true,
      otHours: true,
    },
  });

  const pmStaff = staff.filter((s) => s.role === "PROJECT_MANAGER");
  const engStaff = staff.filter((s) => s.role === "ENGINEER");

  const pmSalaryCost = pmStaff.reduce((s, x) => s + x.salaryCost, 0);
  const pmOTCost = pmStaff.reduce((s, x) => s + x.otCost, 0);

  const engSalaryCost = engStaff.reduce((s, x) => s + x.salaryCost, 0);
  const engOTCost = engStaff.reduce((s, x) => s + x.otCost, 0);

  const totalStaffSalary = pmSalaryCost + engSalaryCost;
  const totalStaffOT = pmOTCost + engOTCost;
  const totalStaffCost = totalStaffSalary + totalStaffOT;

  return {
    pmSalaryCost,
    pmOTCost,
    pmTotalCost: pmSalaryCost + pmOTCost,
    engSalaryCost,
    engOTCost,
    engTotalCost: engSalaryCost + engOTCost,
    totalStaffSalary,
    totalStaffOT,
    totalStaffCost,
  };
}
