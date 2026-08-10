// ============================================================
// src/lib/repositories/reportRepository.ts
// Database repository for Central ERP Reports
// ============================================================

import { prisma } from "@/lib/prisma";
import { calculateProjectCostBreakdown } from "./projectRepository";

export async function getProjectCostSummaryReport() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
      projectManager: true,
      engineers: { include: { engineer: true } },
      expenses: true,
      projectLabours: { include: { overtimes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((p) => {
    const cost = calculateProjectCostBreakdown(p);
    const leadEng = p.engineers.find((e) => e.isLead)?.engineer?.name || "Unassigned";

    return {
      id: p.id,
      projectCode: p.projectCode,
      projectName: p.projectName,
      customerName: p.customer.companyName,
      pmName: p.projectManager.name,
      leadEngineer: leadEng,
      status: p.status,
      projectValue: cost.projectValue,
      estimatedTotalCost: cost.estimatedTotalCost,
      actualTotalCost: cost.actualTotalCost,
      estimatedProfit: cost.estimatedProfit,
      actualProfit: cost.actualProfit,
      costVariance: cost.costVariance,
      budgetBalance: cost.budgetBalance,
      profitOrLoss: cost.profitOrLoss,
      completionPercentage: cost.completionPercentage,
    };
  });
}

export async function getCategoryExpenseReport() {
  const expenses = await prisma.projectExpense.groupBy({
    by: ["expenseType"],
    _sum: { amount: true },
    _count: { id: true },
  });

  return expenses.map((e) => ({
    expenseType: e.expenseType,
    totalAmount: e._sum.amount || 0,
    count: e._count.id,
  }));
}

export async function getTransportReport() {
  const transports = await prisma.projectTransport.findMany({
    include: {
      project: { select: { id: true, projectCode: true, projectName: true } },
      createdByUser: { select: { name: true } },
    },
    orderBy: { transportDate: "desc" },
  });

  return transports;
}

export async function getEngineerProjectsReport() {
  const engineers = await prisma.user.findMany({
    where: {
      role: { in: ["ENGINEER", "PROJECT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
      isActive: true,
    },
    include: {
      assignedEngineers: {
        include: {
          project: { select: { id: true, projectCode: true, projectName: true, status: true } },
        },
      },
    },
  });

  return engineers.map((eng) => ({
    id: eng.id,
    name: eng.name,
    email: eng.email,
    role: eng.role,
    totalProjectsAssigned: eng.assignedEngineers.length,
    leadProjectsCount: eng.assignedEngineers.filter((a) => a.isLead).length,
    activeProjectsCount: eng.assignedEngineers.filter(
      (a) => a.project.status !== "COMPLETED" && a.project.status !== "CANCELLED"
    ).length,
  }));
}

export async function getCustomerProjectsReport() {
  const customers = await prisma.customer.findMany({
    include: {
      projects: {
        include: { expenses: true },
      },
    },
  });

  return customers.map((c) => {
    const totalProjects = c.projects.length;
    const activeProjects = c.projects.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
    ).length;

    const totalEstimatedBudget = c.projects.reduce((sum, p) => sum + (p.estimatedTotalCost || 0), 0);
    const totalActualExpense = c.projects.reduce(
      (sum, p) => sum + p.expenses.reduce((s, e) => s + e.amount, 0),
      0
    );

    return {
      id: c.id,
      companyName: c.companyName,
      contactPerson: c.contactPerson,
      phone: c.phone,
      totalProjects,
      activeProjects,
      totalEstimatedBudget,
      totalActualExpense,
    };
  });
}
