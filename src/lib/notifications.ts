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
): Promise<void> {
  try {
    // Resolve recipients server-side — only active admins/super-admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        isActive: true,
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      console.warn("[Notifications] No active ADMIN/SUPER_ADMIN users found to notify.");
      return;
    }

    // Create one notification per admin (bulk createMany for efficiency)
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        type: "MATERIAL_REQUEST_CREATED" as const,
        title: "New Material Request",
        message: `${requesterName} submitted a material request for "${projectName}".`,
        isRead: false,
        materialRequestId: requestId,
        userId: admin.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      `[Notifications] Notified ${admins.length} admin(s) of new Material Request ${requestNo}.`,
    );
  } catch (err) {
    // Non-fatal — log but never throw so the parent service call succeeds
    console.error("[Notifications] Failed to create submission notifications:", err);
  }
}

// ─── Notify on Decision (Approved / Rejected) ─────────────────────────────────

/**
 * Called when a Material Request is approved or rejected.
 *
 * Creates one Notification for the original requester (engineer/PM).
 * Non-fatal: logs errors to console but does NOT throw.
 *
 * @param requestId   - The MaterialRequest.id
 * @param requestNo   - Human-readable request number
 * @param status      - The new status: "APPROVED" or "REJECTED"
 * @param engineerId  - The User.id of the requester (resolved from DB record)
 * @param projectName - The project name for display
 * @param remarks     - Optional rejection/approval remarks
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

    let message: string;
    if (isApproved) {
      message = `Your material request ${requestNo} for project "${projectName}" has been approved and is ready for issue.`;
    } else {
      message = `Your material request ${requestNo} for project "${projectName}" has been rejected.`;
      if (remarks && remarks.trim()) {
        message += ` Reason: ${remarks.trim()}`;
      }
    }

    await prisma.notification.create({
      data: {
        type: isApproved
          ? "MATERIAL_REQUEST_APPROVED"
          : "MATERIAL_REQUEST_REJECTED",
        title: isApproved
          ? `Material Request Approved — ${requestNo}`
          : `Material Request Rejected — ${requestNo}`,
        message,
        isRead: false,
        materialRequestId: requestId,
        userId: engineerId, // always from the DB record, never from client
      },
    });

    console.log(
      `[Notifications] Notified engineer (${engineerId}) of ${status} decision on ${requestNo}.`,
    );
  } catch (err) {
    // Non-fatal
    console.error("[Notifications] Failed to create decision notification:", err);
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
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (approvers.length === 0) {
      console.warn("[Notifications] No active ADMIN or SUPER_ADMIN users found to notify.");
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

