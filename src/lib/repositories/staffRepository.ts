// ============================================================
// src/lib/repositories/staffRepository.ts
// Database queries for Project Staff Assignments & Attendance
// ============================================================

import { prisma } from "@/lib/prisma";
import type {
  ProjectStaffRole,
  ProjectStaffStatus,
  StaffAttendanceStatus,
} from "@/generated/prisma/client";
import type {
  AssignStaffInput,
  UpdateStaffInput,
  AddAttendanceInput,
  UpdateAttendanceInput,
} from "@/lib/validations/staff";

// ── Worked Days Calculation Helper ──────────────────────────────────────────

export function calculateWorkedDaysFromAttendances(
  attendances: { status: StaffAttendanceStatus }[]
): number {
  return attendances.reduce((sum, att) => {
    if (att.status === "PRESENT") return sum + 1;
    if (att.status === "HALF_DAY") return sum + 0.5;
    return sum;
  }, 0);
}

// ── Repository Queries ───────────────────────────────────────────────────────

export async function getProjectStaff(projectId: number) {
  const staffList = await prisma.projectStaff.findMany({
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
      attendances: {
        orderBy: { workDate: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { assignedDate: "desc" }],
  });

  return staffList.map((staff) => {
    const workedDays = calculateWorkedDaysFromAttendances(staff.attendances);
    const totalAttendanceOT = staff.attendances.reduce((s, a) => s + (a.otHours || 0), 0);
    const totalStaffCost = staff.salaryCost + staff.otCost;

    return {
      ...staff,
      workedDays,
      totalAttendanceOT,
      totalStaffCost,
    };
  });
}

export async function getProjectStaffById(id: number) {
  const staff = await prisma.projectStaff.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      project: {
        select: { id: true, projectCode: true, projectName: true, status: true },
      },
      attendances: {
        orderBy: { workDate: "desc" },
      },
    },
  });

  if (!staff) return null;

  const workedDays = calculateWorkedDaysFromAttendances(staff.attendances);
  const totalAttendanceOT = staff.attendances.reduce((s, a) => s + (a.otHours || 0), 0);
  const totalStaffCost = staff.salaryCost + staff.otCost;

  return {
    ...staff,
    workedDays,
    totalAttendanceOT,
    totalStaffCost,
  };
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

// ── Attendance Queries ───────────────────────────────────────────────────────

export async function getStaffAttendance(projectStaffId: number) {
  return prisma.projectStaffAttendance.findMany({
    where: { projectStaffId },
    orderBy: { workDate: "desc" },
  });
}

export async function upsertStaffAttendance(data: AddAttendanceInput) {
  const workDateObj = new Date(data.workDate);
  workDateObj.setHours(0, 0, 0, 0);

  let hours = data.workedHours;
  if (hours === 0) {
    if (data.status === "PRESENT") hours = 8;
    else if (data.status === "HALF_DAY") hours = 4;
  }

  return prisma.projectStaffAttendance.upsert({
    where: {
      projectStaffId_workDate: {
        projectStaffId: data.projectStaffId,
        workDate: workDateObj,
      },
    },
    create: {
      projectStaffId: data.projectStaffId,
      workDate: workDateObj,
      status: data.status as StaffAttendanceStatus,
      workedHours: hours,
      otHours: data.otHours,
      remarks: data.remarks ?? null,
    },
    update: {
      status: data.status as StaffAttendanceStatus,
      workedHours: hours,
      otHours: data.otHours,
      remarks: data.remarks ?? null,
    },
  });
}

export async function updateStaffAttendanceRecord(id: number, data: Omit<UpdateAttendanceInput, "id">) {
  return prisma.projectStaffAttendance.update({
    where: { id },
    data: {
      status: data.status as StaffAttendanceStatus,
      workedHours: data.workedHours,
      otHours: data.otHours,
      remarks: data.remarks ?? null,
    },
  });
}

export async function deleteStaffAttendanceRecord(id: number) {
  return prisma.projectStaffAttendance.delete({
    where: { id },
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
