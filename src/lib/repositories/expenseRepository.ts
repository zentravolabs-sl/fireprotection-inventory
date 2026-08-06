// ============================================================
// src/lib/repositories/expenseRepository.ts
// Database repository for Centralized Project Expenses
// ============================================================

import { prisma } from "@/lib/prisma";
import { ExpenseType } from "@/types/project";

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

export async function createExpenseRecord(data: {
  expenseNo: string;
  projectId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate?: Date | null;
  description?: string | null;
  referenceNo?: string | null;
  createdBy: string;
}) {
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
      },
    });

    await tx.auditLog.create({
      data: {
        userId: data.createdBy,
        action: "PROJECT_EXPENSE_CREATED",
        metadata: {
          expenseId: expense.id,
          expenseNo: expense.expenseNo,
          amount: data.amount,
          projectId: data.projectId,
        },
      },
    });

    return expense;
  }, { maxWait: 15000, timeout: 60000 });
}
