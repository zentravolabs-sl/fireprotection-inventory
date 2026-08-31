// ============================================================
// src/lib/notifications.ts
// Server-side helpers for creating Material Request in-app
// notifications. These are always called OUTSIDE of Prisma
// transactions so that a notification failure can never roll
// back the parent business operation.
//
// Security note: userId is always resolved server-side from
// the database record. It is NEVER accepted from the client.
// ============================================================

import { prisma } from "@/lib/prisma";

// ─── Notify on Submission ─────────────────────────────────────────────────────

/**
 * Called when a Material Request is submitted (status → PENDING).
 *
 * Creates one Notification row per active ADMIN / SUPER_ADMIN user.
 * Non-fatal: logs errors to console but does NOT throw.
 *
 * @param requestId     - The MaterialRequest.id
 * @param requestNo     - Human-readable request number (e.g. MR-2026-0001)
 * @param projectId     - The project ID (for deep-linking)
 * @param projectName   - The project name for display
 * @param requesterName - The engineer/PM who submitted the request
 * @param requesterId   - The User.id of the requester
 */
export async function notifyMaterialRequestSubmitted(
  requestId: number,
  requestNo: string,
  projectId: number,
  projectName: string,
  requesterName: string,
  requesterId: string,
  isResubmission: boolean = false,
): Promise<void> {
  try {
    // Resolve recipients server-side — active Purchase Engineers, Admins, & Super Admins
    const reviewers = await prisma.user.findMany({
      where: {
        role: { in: ["PURCHASE_ENGINEER", "ADMIN", "SUPER_ADMIN"] },
        isActive: true,
      },
      select: { id: true },
    });

    if (reviewers.length === 0) {
      console.warn("[Notifications] No active PURCHASE_ENGINEER/ADMIN users found to notify.");
      return;
    }

    const title = isResubmission
      ? `Material Request Resubmitted — ${requestNo}`
      : `New Material Request — ${requestNo}`;

    const message = isResubmission
      ? `${requesterName} resubmitted material request ${requestNo} for project "${projectName}". Purchase Engineer review required.`
      : `${requesterName} submitted material request ${requestNo} for project "${projectName}". Purchase Engineer review required.`;

    await prisma.notification.createMany({
      data: reviewers.map((rev) => ({
        type: "MATERIAL_REQUEST_CREATED" as const,
        title,
        message,
        isRead: false,
        materialRequestId: requestId,
        userId: rev.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[Notifications] Notified ${reviewers.length} reviewer(s) of ${isResubmission ? "resubmitted" : "new"} Material Request ${requestNo}.`,
    );
  } catch (err) {
    console.error("[Notifications] Failed to create submission notifications:", err);
  }
}

// ─── Notify on Decision (Approved / Rejected) ─────────────────────────────────

/**
 * Called when a Material Request is approved or rejected by Purchase Engineer.
 *
 * If APPROVED:
 *  - Notifies the requester (Engineer) that their request was approved
 *  - Notifies Inventory Controllers that the request is ready for FIFO issue
 *
 * If REJECTED:
 *  - Notifies the requester (Engineer) with the rejection note so they can edit & resubmit
 */
export async function notifyMaterialRequestDecision(
  requestId: number,
  requestNo: string,
  status: "APPROVED" | "REJECTED",
  engineerId: string,
  projectName: string,
  remarks?: string | null,
): Promise<void> {
  try {
    const isApproved = status === "APPROVED";

    if (isApproved) {
      // 1. Notify the requesting Engineer
      await prisma.notification.create({
        data: {
          type: "MATERIAL_REQUEST_APPROVED",
          title: `Material Request Approved — ${requestNo}`,
          message: `Your material request ${requestNo} for project "${projectName}" has been approved by Purchase Engineer and sent to Inventory Controller for issue.`,
          isRead: false,
          materialRequestId: requestId,
          userId: engineerId,
        },
      });

      // 2. Notify Inventory Controllers (ready for FIFO issue)
      const inventoryControllers = await prisma.user.findMany({
        where: {
          role: { in: ["INVENTORY_CONTROLLER", "SUPER_ADMIN"] },
          isActive: true,
        },
        select: { id: true },
      });

      if (inventoryControllers.length > 0) {
        await prisma.notification.createMany({
          data: inventoryControllers.map((ic) => ({
            type: "MATERIAL_REQUEST_APPROVED" as const,
            title: `Material Request Ready for Issue — ${requestNo}`,
            message: `Material request ${requestNo} for project "${projectName}" was approved by Purchase Engineer and is ready for FIFO issue.`,
            isRead: false,
            materialRequestId: requestId,
            userId: ic.id,
          })),
          skipDuplicates: true,
        });
      }
    } else {
      // REJECTED — Notify the requesting Engineer with rejection reason
      let message = `Your material request ${requestNo} for project "${projectName}" was rejected by Purchase Engineer.`;
      if (remarks && remarks.trim()) {
        message += ` Rejection Note: "${remarks.trim()}"`;
      }
      message += ` Please edit and resubmit your request.`;

      await prisma.notification.create({
        data: {
          type: "MATERIAL_REQUEST_REJECTED",
          title: `Material Request Rejected — ${requestNo}`,
          message,
          isRead: false,
          materialRequestId: requestId,
          userId: engineerId,
        },
      });
    }

    console.log(
      `[Notifications] Sent ${status} decision notifications for request ${requestNo}.`,
    );
  } catch (err) {
    console.error("[Notifications] Failed to create decision notification:", err);
  }
}

// ─── Notify on FIFO Material Issue ────────────────────────────────────────────

/**
 * Called when an Inventory Controller issues materials for an approved request.
 * Notifies the requesting Engineer that materials have been issued.
 */
export async function notifyMaterialIssued(
  requestId: number,
  requestNo: string,
  projectId: number,
  projectName: string,
  engineerId: string,
  issueNo: string,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type: "INFO",
        title: `Materials Issued — ${issueNo}`,
        message: `Materials for request ${requestNo} (project "${projectName}") have been issued from warehouse (Issue #${issueNo}).`,
        isRead: false,
        materialRequestId: requestId,
        userId: engineerId,
      },
    });

    console.log(
      `[Notifications] Notified engineer (${engineerId}) of material issue ${issueNo} for request ${requestNo}.`,
    );
  } catch (err) {
    console.error("[Notifications] Failed to create material issue notification:", err);
  }
}

// ─── Notify on Cost Threshold — Pending Approval ───────────────────────────

/**
 * Called when a new expense would push the project's actual cost to/above LKR 5 M.
 * Creates one Notification per active SUPER_ADMIN user.
 * Non-fatal: logs errors but does NOT throw.
 */
export async function notifyCostThresholdPendingApproval(
  expenseId: number,
  expenseNo: string,
  projectId: number,
  projectName: string,
  amount: number,
  submittedByName: string,
): Promise<void> {
  try {
    const approvers = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (approvers.length === 0) {
      console.warn("[Notifications] No active ADMIN users found to notify.");
      return;
    }

    const formattedAmount = new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(amount);

    await prisma.notification.createMany({
      data: approvers.map((user) => ({
        type: "COST_THRESHOLD_PENDING_APPROVAL" as const,
        title: "⚠ Expense Requires Approval — Monthly Threshold Exceeded",
        message: `${submittedByName} logged expense ${expenseNo} (${formattedAmount}) for project "${projectName}". Total monthly project cost has reached or exceeded LKR 5,000,000. Admin approval required.`,
        isRead: false,
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[Notifications] Notified ${approvers.length} admin(s)/super admin(s) of pending cost threshold expense ${expenseNo}.`,
    );
  } catch (err) {
    console.error("[Notifications] Failed to create cost threshold notification:", err);
  }
}

// ─── Notify on Cost Threshold Decision ────────────────────────────────────────

/**
 * Called when a Super Admin approves or rejects a pending cost-threshold expense.
 * Creates one Notification for the original requester.
 * Non-fatal: logs errors but does NOT throw.
 */
export async function notifyCostThresholdDecision(
  expenseNo: string,
  projectName: string,
  requesterId: string,
  approved: boolean,
  note?: string | null,
): Promise<void> {
  try {
    let message: string;
    if (approved) {
      message = `Your expense ${expenseNo} for project "${projectName}" has been approved by a Super Admin and is now live in the cost ledger.`;
    } else {
      message = `Your expense ${expenseNo} for project "${projectName}" was rejected by a Super Admin.`;
      if (note?.trim()) {
        message += ` Reason: ${note.trim()}`;
      }
    }

    await prisma.notification.create({
      data: {
        type: approved ? "COST_THRESHOLD_APPROVED" : "COST_THRESHOLD_REJECTED",
        title: approved
          ? `Expense Approved — ${expenseNo}`
          : `Expense Rejected — ${expenseNo}`,
        message,
        isRead: false,
        userId: requesterId,
      },
    });

    console.log(
      `[Notifications] Notified requester (${requesterId}) of ${approved ? "approval" : "rejection"} of ${expenseNo}.`,
    );
  } catch (err) {
    console.error("[Notifications] Failed to create cost threshold decision notification:", err);
  }
}

