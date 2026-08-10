// ============================================================
// src/lib/repositories/projectRepository.ts
// Database repository for Projects, Multi-Engineers, Expenses, Transport, & Cost Breakdown
// ============================================================

import { prisma } from "@/lib/prisma";
import { ProjectStatus, ProjectCostBreakdown } from "@/types/project";

export async function findProjectById(id: number) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      projectManager: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      engineers: {
        orderBy: [{ isLead: "desc" }, { assignedDate: "asc" }],
        include: {
          engineer: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          assignedByUser: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
        },
      },
      assignments: {
        orderBy: { assignedDate: "desc" },
        include: {
          projectManager: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          assignedByUser: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
        },
      },
      materialRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          engineer: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          items: {
            include: {
              inventory: {
                select: { id: true, itemCode: true, name: true, unit: true, brand: true },
              },
            },
          },
        },
      },
      projectMaterials: {
        orderBy: { createdAt: "desc" },
        include: {
          inventory: {
            select: { id: true, itemCode: true, name: true, unit: true },
          },
          materialIssueItem: {
            include: {
              stockBatch: {
                select: { id: true, batchNo: true, unitCost: true },
              },
            },
          },
        },
      },
      materialReturns: {
        orderBy: { createdAt: "desc" },
        include: {
          engineer: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          items: {
            include: {
              inventory: {
                select: { id: true, itemCode: true, name: true, unit: true },
              },
            },
          },
        },
      },
      transports: {
        orderBy: { transportDate: "desc" },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
        },
      },
      expenses: {
        orderBy: { expenseDate: "desc" },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
        },
      },
      projectLabours: {
        include: {
          overtimes: true,
        },
      },
    },
  });

  if (!project) return null;

  // Calculate actual costs strictly from ProjectExpense ledger + Labour module (Labour + OT)
  const costBreakdown = calculateProjectCostBreakdown(project);

  return {
    ...project,
    costBreakdown,
  };
}

export function calculateProjectCostBreakdown(project: any): ProjectCostBreakdown {
  const projectValue = project.projectValue || 0;
  const expenses = project.expenses || [];

  const actualMaterialCost = expenses
    .filter((e: any) => e.expenseType === "MATERIAL")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const actualLabourCostFromExpenses = expenses
    .filter((e: any) => e.expenseType === "LABOUR")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const labourModuleCost = (project.projectLabours || []).reduce((sum: number, pl: any) => {
    const cost = pl.labourCost || 0;
    const otTotal = (pl.overtimes || []).reduce((otSum: number, ot: any) => otSum + (ot.otAmount || 0), 0);
    return sum + cost + otTotal;
  }, 0);

  const actualLabourCost = actualLabourCostFromExpenses + labourModuleCost;

  const actualTransportCost = expenses
    .filter((e: any) => e.expenseType === "TRANSPORT")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const actualEquipmentCost = expenses
    .filter((e: any) => e.expenseType === "EQUIPMENT")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const actualOtherCost = expenses
    .filter((e: any) => e.expenseType === "OTHER")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const actualTotalCost =
    actualMaterialCost +
    actualLabourCost +
    actualTransportCost +
    actualEquipmentCost +
    actualOtherCost;

  const estimatedTotalCost = project.estimatedTotalCost || 0;
  const costVariance = estimatedTotalCost - actualTotalCost;
  const budgetBalance = estimatedTotalCost - actualTotalCost;

  // Profit Calculations
  const estimatedProfit = projectValue - estimatedTotalCost;
  const actualProfit = projectValue - actualTotalCost;
  const profitOrLoss = actualProfit;

  const estimatedProfitMargin = projectValue > 0 ? (estimatedProfit / projectValue) * 100 : 0;
  const actualProfitMargin = projectValue > 0 ? (actualProfit / projectValue) * 100 : 0;

  let completionPercentage = 0;
  if (project.status === "COMPLETED") {
    completionPercentage = 100;
  } else if (project.status === "IN_PROGRESS" || project.status === "MATERIAL_ISSUED") {
    completionPercentage = Math.min(
      95,
      Math.max(20, Math.round((actualTotalCost / (estimatedTotalCost || 1)) * 100))
    );
  } else if (project.status === "MATERIAL_APPROVED" || project.status === "MATERIAL_REQUEST") {
    completionPercentage = 15;
  }

  return {
    projectValue,
    estimatedMaterialCost: project.estimatedMaterialCost || 0,
    estimatedLabourCost: project.estimatedLabourCost || 0,
    estimatedTransportCost: project.estimatedTransportCost || 0,
    estimatedEquipmentCost: project.estimatedEquipmentCost || 0,
    estimatedOtherCost: project.estimatedOtherCost || 0,
    estimatedTotalCost,

    actualMaterialCost,
    actualLabourCost,
    actualTransportCost,
    actualEquipmentCost,
    actualOtherCost,
    actualTotalCost,

    estimatedProfit,
    actualProfit,
    estimatedProfitMargin,
    actualProfitMargin,

    costVariance,
    budgetBalance,
    profitOrLoss,
    completionPercentage,
  };
}

export async function findProjects(params: {
  search?: string;
  status?: ProjectStatus;
  customerId?: number;
  engineerId?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.customerId) {
    where.customerId = params.customerId;
  }

  if (params.engineerId) {
    where.engineers = {
      some: { engineerId: params.engineerId },
    };
  }

  if (params.search && params.search.trim() !== "") {
    const s = params.search.trim();
    where.OR = [
      { projectCode: { contains: s, mode: "insensitive" } },
      { projectName: { contains: s, mode: "insensitive" } },
      { location: { contains: s, mode: "insensitive" } },
      { customer: { companyName: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        projectManager: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        engineers: {
          include: {
            engineer: {
              select: { id: true, name: true, email: true, role: true, isActive: true },
            },
          },
        },
        expenses: {
          select: { amount: true, expenseType: true },
        },
        projectLabours: {
          select: {
            labourCost: true,
            overtimes: { select: { otAmount: true } },
          },
        },
        _count: {
          select: {
            materialRequests: true,
            projectMaterials: true,
            materialReturns: true,
            transports: true,
            expenses: true,
          },
        },
      },
    }),
  ]);

  const formattedProjects = projects.map((p) => {
    const costBreakdown = calculateProjectCostBreakdown(p);
    return {
      ...p,
      costBreakdown,
    };
  });

  return {
    projects: formattedProjects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.project.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `PRJ-${year}-${seq}`;
}

export async function createProject(data: {
  projectCode: string;
  projectName: string;
  customerId: number;
  projectManagerId: string;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  description?: string | null;
  projectValue?: number;
  estimatedMaterialCost?: number;
  estimatedLabourCost?: number;
  estimatedTransportCost?: number;
  estimatedEquipmentCost?: number;
  estimatedOtherCost?: number;
  assignedBy: string;
}) {
  const projectValue = data.projectValue || 0;
  const estMat = data.estimatedMaterialCost || 0;
  const estLab = data.estimatedLabourCost || 0;
  const estTrn = data.estimatedTransportCost || 0;
  const estEqp = data.estimatedEquipmentCost || 0;
  const estOth = data.estimatedOtherCost || 0;
  const estTot = estMat + estLab + estTrn + estEqp + estOth;

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        projectCode: data.projectCode,
        projectName: data.projectName,
        customerId: data.customerId,
        projectManagerId: data.projectManagerId,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        projectValue,
        estimatedMaterialCost: estMat,
        estimatedLabourCost: estLab,
        estimatedTransportCost: estTrn,
        estimatedEquipmentCost: estEqp,
        estimatedOtherCost: estOth,
        estimatedTotalCost: estTot,
        status: "PENDING",
      },
    });

    await tx.projectAssignment.create({
      data: {
        projectId: project.id,
        projectManagerId: data.projectManagerId,
        assignedBy: data.assignedBy,
      },
    });

    return project;
  });
}

export async function assignEngineerToProject(data: {
  projectId: number;
  engineerId: string;
  isLead?: boolean;
  assignedBy: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Check duplicate assignment
    const existing = await tx.projectEngineer.findUnique({
      where: {
        projectId_engineerId: {
          projectId: data.projectId,
          engineerId: data.engineerId,
        },
      },
    });

    if (existing) {
      throw new Error("Engineer is already assigned to this project.");
    }

    if (data.isLead) {
      // Unset previous lead engineers
      await tx.projectEngineer.updateMany({
        where: { projectId: data.projectId },
        data: { isLead: false },
      });
    }

    const assignment = await tx.projectEngineer.create({
      data: {
        projectId: data.projectId,
        engineerId: data.engineerId,
        isLead: data.isLead || false,
        assignedBy: data.assignedBy,
      },
    });

    return assignment;
  });
}

export async function removeEngineerFromProject(projectId: number, engineerId: string) {
  return prisma.projectEngineer.delete({
    where: {
      projectId_engineerId: {
        projectId,
        engineerId,
      },
    },
  });
}

export async function setLeadEngineer(projectId: number, engineerId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.projectEngineer.updateMany({
      where: { projectId },
      data: { isLead: false },
    });

    return tx.projectEngineer.update({
      where: {
        projectId_engineerId: {
          projectId,
          engineerId,
        },
      },
      data: { isLead: true },
    });
  });
}

export async function updateProjectCosts(data: {
  projectId: number;
  projectValue?: number;
  estimatedMaterialCost: number;
  estimatedLabourCost: number;
  estimatedTransportCost: number;
  estimatedEquipmentCost: number;
  estimatedOtherCost: number;
}) {
  const estimatedTotalCost =
    data.estimatedMaterialCost +
    data.estimatedLabourCost +
    data.estimatedTransportCost +
    data.estimatedEquipmentCost +
    data.estimatedOtherCost;

  const updateData: any = {
    estimatedMaterialCost: data.estimatedMaterialCost,
    estimatedLabourCost: data.estimatedLabourCost,
    estimatedTransportCost: data.estimatedTransportCost,
    estimatedEquipmentCost: data.estimatedEquipmentCost,
    estimatedOtherCost: data.estimatedOtherCost,
    estimatedTotalCost,
  };

  if (data.projectValue !== undefined) {
    updateData.projectValue = data.projectValue;
  }

  return prisma.project.update({
    where: { id: data.projectId },
    data: updateData,
  });
}

export async function updateProjectStatus(id: number, status: ProjectStatus) {
  return prisma.project.update({
    where: { id },
    data: { status },
  });
}

export async function deleteProject(id: number) {
  return prisma.project.delete({
    where: { id },
  });
}

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    activeProjects,
    pendingMaterialRequests,
    materialsIssuedTodayCount,
    materialsReturnedTodayCount,
    completedProjects,
    batches,
    totalEstimated,
    totalActual,
    totalProjectVal,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),
    prisma.materialRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.materialIssue.count({
      where: {
        issueDate: { gte: startOfDay },
      },
    }),
    prisma.materialReturn.count({
      where: {
        returnedDate: { gte: startOfDay },
      },
    }),
    prisma.project.count({
      where: { status: "COMPLETED" },
    }),
    prisma.stockBatch.findMany({
      select: {
        availableQty: true,
        unitCost: true,
      },
    }),
    prisma.project.aggregate({
      _sum: { estimatedTotalCost: true },
    }),
    prisma.projectExpense.aggregate({
      _sum: { amount: true },
    }),
    prisma.project.aggregate({
      _sum: { projectValue: true },
    }),
  ]);

  const totalInventoryValue = batches.reduce(
    (sum, b) => sum + b.availableQty * b.unitCost,
    0
  );

  const totalProjectValue = totalProjectVal._sum.projectValue || 0;
  const totalEstimatedCost = totalEstimated._sum.estimatedTotalCost || 0;
  const totalActualCost = totalActual._sum.amount || 0;
  const totalEstimatedProfit = totalProjectValue - totalEstimatedCost;
  const totalActualProfit = totalProjectValue - totalActualCost;

  return {
    activeProjects,
    pendingMaterialRequests,
    materialsIssuedToday: materialsIssuedTodayCount,
    materialsReturnedToday: materialsReturnedTodayCount,
    completedProjects,
    totalInventoryValue,
    totalProjectValue,
    totalEstimatedCost,
    totalActualCost,
    totalEstimatedProfit,
    totalActualProfit,
  };
}
