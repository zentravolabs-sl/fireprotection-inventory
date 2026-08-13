"use server";

// ============================================================
// src/app/actions/transfers.ts
// Server Actions for Project Stock Transfers
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createProjectTransferSchema,
  type CreateProjectTransferInput,
  type ProjectTransferFilterInput,
} from "@/lib/validations/transfer";
import {
  createProjectTransferService,
  submitProjectTransferService,
  approveProjectTransferService,
  completeProjectTransferService,
  cancelProjectTransferService,
  getProjectTransfersService,
  getProjectTransferByIdService,
  getAvailableStockForProject,
} from "@/lib/services/projectTransferService";

// ─── Actor Session Helper ──────────────────────────────────────────────────────

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Fallback
  }

  const defaultUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return defaultUser?.id || "system";
}

// ─── Server Actions ────────────────────────────────────────────────────────────

export async function createProjectTransferAction(input: CreateProjectTransferInput) {
  try {
    const actorId = await getActorId();

    const parsed = createProjectTransferSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const transfer = await createProjectTransferService(parsed.data, actorId);

    revalidatePath("/transfers");
    revalidatePath(`/projects/${parsed.data.fromProjectId}`);
    revalidatePath(`/projects/${parsed.data.toProjectId}`);

    return {
      success: true,
      message: `Transfer draft ${transfer.transferNo} created successfully!`,
      data: transfer,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to create project transfer.",
    };
  }
}

export async function submitProjectTransferAction(transferId: number) {
  try {
    const actorId = await getActorId();
    const transfer = await submitProjectTransferService(transferId, actorId);

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath(`/projects/${transfer.fromProjectId}`);
    revalidatePath(`/projects/${transfer.toProjectId}`);

    return {
      success: true,
      message: `Transfer ${transfer.transferNo} submitted for approval.`,
      data: transfer,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to submit project transfer.",
    };
  }
}

export async function approveProjectTransferAction(transferId: number) {
  try {
    const actorId = await getActorId();
    const transfer = await approveProjectTransferService(transferId, actorId);

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath(`/projects/${transfer.fromProjectId}`);
    revalidatePath(`/projects/${transfer.toProjectId}`);

    return {
      success: true,
      message: `Transfer ${transfer.transferNo} approved successfully!`,
      data: transfer,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to approve project transfer.",
    };
  }
}

export async function completeProjectTransferAction(transferId: number) {
  try {
    const actorId = await getActorId();
    const transfer = await completeProjectTransferService(transferId, actorId);

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath(`/projects/${transfer.fromProjectId}`);
    revalidatePath(`/projects/${transfer.toProjectId}`);
    revalidatePath("/stock-movement");
    revalidatePath("/reports");

    return {
      success: true,
      message: `Transfer ${transfer.transferNo} completed successfully! Project stock updated.`,
      data: transfer,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to complete project transfer.",
    };
  }
}

export async function cancelProjectTransferAction(transferId: number) {
  try {
    const actorId = await getActorId();
    const transfer = await cancelProjectTransferService(transferId, actorId);

    revalidatePath("/transfers");
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath(`/projects/${transfer.fromProjectId}`);
    revalidatePath(`/projects/${transfer.toProjectId}`);

    return {
      success: true,
      message: `Transfer ${transfer.transferNo} cancelled.`,
      data: transfer,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to cancel project transfer.",
    };
  }
}

export async function getProjectTransfersAction(filters?: ProjectTransferFilterInput) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as any;
    const userRole = user?.role;
    const userId = user?.id;

    const res = await getProjectTransfersService({
      ...filters,
      ...(userRole === "ENGINEER" ? { engineerId: userId } : {}),
    });
    return { success: true, data: res.transfers, counts: res.counts };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to fetch transfers." };
  }
}

export async function getProjectTransferByIdAction(transferId: number) {
  try {
    const transfer = await getProjectTransferByIdService(transferId);
    if (!transfer) return { success: false, message: "Transfer not found." };
    return { success: true, data: transfer };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to fetch transfer details." };
  }
}

export async function getAvailableStockAction(projectId: number) {
  try {
    const stock = await getAvailableStockForProject(projectId);
    return { success: true, data: stock };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to fetch source project stock." };
  }
}
