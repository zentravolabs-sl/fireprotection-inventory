// ============================================================
// src/lib/repositories/expenseRepository.ts
// Database repository for Centralized Project Expenses
// ============================================================

import { prisma } from "@/lib/prisma";
import { ExpenseType } from "@/types/project";

/** LKR threshold above which an expense requires Super Admin approval. */
export const COST_APPROVAL_THRESHOLD = 5_000_000;

export async function generateExpenseNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.projectExpense.count();
  const seq = (count + 1).toString().padStart(4, "0");
  return `EXP-${year}-${seq}`;
}

export async function findExpensesByProjectId(projectId: number) {
  return prisma.projectExpense.findMany({
    where: { projectId },
    orderBy: { expenseDate: "desc" },
    include: {
      createdByUser: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });
}

/**
 * Returns the current APPROVED actual cost for a project.
 * Only counts expenses whose approvalStatus is APPROVED.
 */
export async function getProjectApprovedActualCost(projectId: number): Promise<number> {
  // Sum from expense ledger (APPROVED only)
  const expenseSum = await prisma.projectExpense.aggregate({
    where: { projectId, approvalStatus: "APPROVED" },
    _sum: { amount: true },
  });

  // Add labour module costs
  const labours = await prisma.projectLabour.findMany({
    where: { projectId },
    include: { overtimes: { select: { otAmount: true } } },
  });
  const labourCost = labours.reduce((sum, pl) => {
    const ot = pl.overtimes.reduce((s, ot) => s + (ot.otAmount || 0), 0);
    return sum + (pl.labourCost || 0) + ot;
  }, 0);

  // Add staff costs
  const staffCosts = await prisma.projectStaff.aggregate({
    where: { projectId },
    _sum: { salaryCost: true, otCost: true },
  });
  const staffCost = (staffCosts._sum.salaryCost || 0) + (staffCosts._sum.otCost || 0);

  return (expenseSum._sum.amount || 0) + labourCost + staffCost;
}

/**
 * Returns the total APPROVED actual cost across ALL projects for the current calendar month.
 * Used for checking the global 5,000,000 LKR monthly cost threshold.
 */
export async function getGlobalCurrentMonthApprovedCost(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const expenseSum = await prisma.projectExpense.aggregate({
    where: {
      approvalStatus: "APPROVED",
      expenseDate: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  const labours = await prisma.projectLabour.findMany({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { overtimes: { select: { otAmount: true } } },
  });
  const labourCost = labours.reduce((sum, pl) => {
    const ot = pl.overtimes.reduce((s, ot) => s + (ot.otAmount || 0), 0);
    return sum + (pl.labourCost || 0) + ot;
  }, 0);

  const staffCosts = await prisma.projectStaff.aggregate({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { salaryCost: true, otCost: true },
  });
  const staffCost = (staffCosts._sum.salaryCost || 0) + (staffCosts._sum.otCost || 0);

  return (expenseSum._sum.amount || 0) + labourCost + staffCost;
}

/** All expenses across all projects that are awaiting Super Admin approval. */
export async function findPendingApprovalExpenses() {
  return prisma.projectExpense.findMany({
    where: { approvalStatus: "PENDING_APPROVAL" },
    orderBy: { createdAt: "asc" },
    include: {
      project: {
        select: { id: true, projectCode: true, projectName: true },
      },
      createdByUser: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });
}

export async function createExpenseRecord(data: {
  expenseNo: string;
  projectId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate?: Date | null;
  description?: string | null;
  referenceNo?: string | null;
  createdBy: string;
  approvalStatus?: "APPROVED" | "PENDING_APPROVAL";
}) {
  const approvalStatus = data.approvalStatus ?? "APPROVED";

  return prisma.$transaction(async (tx) => {
    const expense = await tx.projectExpense.create({
      data: {
        expenseNo: data.expenseNo,
        projectId: data.projectId,
        expenseType: data.expenseType,
        amount: data.amount,
        expenseDate: data.expenseDate || new Date(),
        description: data.description,
        referenceNo: data.referenceNo,
        createdBy: data.createdBy,
        approvalStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: data.createdBy,
        action: approvalStatus === "PENDING_APPROVAL"
          ? "PROJECT_EXPENSE_PENDING_APPROVAL"
          : "PROJECT_EXPENSE_CREATED",
        metadata: {
          expenseId: expense.id,
          expenseNo: expense.expenseNo,
          amount: data.amount,
          projectId: data.projectId,
          approvalStatus,
        },
      },
    });

    return expense;
  }, { maxWait: 15000, timeout: 60000 });
}

/** Super Admin approves a pending expense. */
export async function approveExpenseRecord(expenseId: number, approverId: string) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.projectExpense.update({
      where: { id: expenseId },
      data: {
        approvalStatus: "APPROVED",
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalNote: null,
      },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: approverId,
        action: "PROJECT_EXPENSE_APPROVED",
        metadata: {
          expenseId: expense.id,
          expenseNo: expense.expenseNo,
          amount: expense.amount,
          projectId: expense.projectId,
        },
      },
    });

    return expense;
  }, { maxWait: 15000, timeout: 60000 });
}

/** Super Admin rejects a pending expense. */
export async function rejectExpenseRecord(
  expenseId: number,
  approverId: string,
  note?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.projectExpense.update({
      where: { id: expenseId },
      data: {
        approvalStatus: "REJECTED",
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalNote: note || null,
      },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (expense.expenseType === "TRANSPORT" && expense.referenceNo) {
      await tx.projectTransport.updateMany({
        where: { transportNo: expense.referenceNo },
        data: { status: "CANCELLED" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: approverId,
        action: "PROJECT_EXPENSE_REJECTED",
        metadata: {
          expenseId: expense.id,
          expenseNo: expense.expenseNo,
          amount: expense.amount,
          projectId: expense.projectId,
          note,
        },
      },
    });

    return expense;
  }, { maxWait: 15000, timeout: 60000 });
}
