"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations/project";
import {
  COST_APPROVAL_THRESHOLD,
  generateExpenseNo,
  createExpenseRecord,
  getGlobalCurrentMonthApprovedCost,
  approveExpenseRecord,
  rejectExpenseRecord,
} from "@/lib/repositories/expenseRepository";
import {
  notifyCostThresholdPendingApproval,
  notifyCostThresholdDecision,
} from "@/lib/notifications";
import { ExpenseType } from "@/types/project";
import { getSession } from "@/lib/session";

/** Roles that are allowed to approve / reject cost-threshold expenses. */
const APPROVER_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (err) {
    // Fallback to active admin user for demo resilience
  }

  const defaultUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return defaultUser?.id || "system";
}

export async function createExpenseAction(formData: FormData) {
  try {
    const actorId = await getActorId();

    const raw = {
      projectId: Number(formData.get("projectId")),
      expenseType: formData.get("expenseType") as ExpenseType,
      amount: Number(formData.get("amount")),
      expenseDate: formData.get("expenseDate") || undefined,
      description: formData.get("description") || undefined,
      referenceNo: formData.get("referenceNo") || undefined,
    };

    const parsed = createExpenseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid expense data",
      };
    }

    // ── Global monthly cost threshold check ──────────────────────────────
    const currentMonthCost = await getGlobalCurrentMonthApprovedCost();
    const projectedCost = currentMonthCost + parsed.data.amount;
    const needsApproval = projectedCost >= COST_APPROVAL_THRESHOLD;

    const expenseNo = await generateExpenseNo();

    const expense = await createExpenseRecord({
      expenseNo,
      projectId: parsed.data.projectId,
      expenseType: parsed.data.expenseType,
      amount: parsed.data.amount,
      expenseDate: parsed.data.expenseDate ? new Date(parsed.data.expenseDate) : new Date(),
      description: parsed.data.description || null,
      referenceNo: parsed.data.referenceNo || null,
      createdBy: actorId,
      approvalStatus: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
    });

    // ── Fire notification if pending approval (non-fatal) ─────────────────
    if (needsApproval) {
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true },
      });
      const project = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { projectName: true },
      });

      await notifyCostThresholdPendingApproval(
        expense.id,
        expense.expenseNo,
        parsed.data.projectId,
        project?.projectName || `Project #${parsed.data.projectId}`,
        parsed.data.amount,
        actor?.name || "A team member",
      );
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);

    if (needsApproval) {
      return {
        success: true,
        requiresApproval: true,
        message: `Expense ${expense.expenseNo} submitted and is awaiting Super Admin approval — project actual cost has reached LKR 5,000,000 threshold.`,
        data: expense,
      };
    }

    return {
      success: true,
      requiresApproval: false,
      message: `Expense ${expense.expenseNo} logged successfully! Project actual cost updated.`,
      data: expense,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to log project expense",
    };
  }
}

/** Admin or Super Admin approves a pending expense. */
export async function approveExpenseAction(expenseId: number) {
  try {
    const session = await getSession();
    const user = session?.user;
    if (!user || !APPROVER_ROLES.has(user.role as string)) {
      return { success: false, message: "FORBIDDEN: Only Admins can approve expenses." };
    }

    // Verify the expense exists and is pending
    const existing = await prisma.projectExpense.findUnique({
      where: { id: expenseId },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Expense not found." };
    }
    if (existing.approvalStatus !== "PENDING_APPROVAL") {
      return { success: false, message: `Expense is already ${existing.approvalStatus}.` };
    }

    const updated = await approveExpenseRecord(expenseId, user.id);

    // Notify the original requester (non-fatal)
    await notifyCostThresholdDecision(
      updated.expenseNo,
      updated.project.projectName,
      updated.createdByUser.id,
      true,
    );

    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath("/super-admin");

    return {
      success: true,
      message: `Expense ${updated.expenseNo} approved and is now live in the cost ledger.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to approve expense.",
    };
  }
}

/** Admin or Super Admin rejects a pending expense. */
export async function rejectExpenseAction(expenseId: number, note?: string) {
  try {
    const session = await getSession();
    const user = session?.user;
    if (!user || !APPROVER_ROLES.has(user.role as string)) {
      return { success: false, message: "FORBIDDEN: Only Admins can reject expenses." };
    }

    const existing = await prisma.projectExpense.findUnique({
      where: { id: expenseId },
      include: {
        project: { select: { id: true, projectCode: true, projectName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Expense not found." };
    }
    if (existing.approvalStatus !== "PENDING_APPROVAL") {
      return { success: false, message: `Expense is already ${existing.approvalStatus}.` };
    }

    const updated = await rejectExpenseRecord(expenseId, user.id, note);

    // Notify the original requester (non-fatal)
    await notifyCostThresholdDecision(
      updated.expenseNo,
      updated.project.projectName,
      updated.createdByUser.id,
      false,
      note,
    );

    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath("/super-admin");

    return {
      success: true,
      message: `Expense ${updated.expenseNo} rejected.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reject expense.",
    };
  }
}
