"use server";

// ============================================================
// src/app/actions/material-requests.ts
// Server Actions for Material Requests
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMaterialRequestSchema,
  approveMaterialRequestSchema,
  resubmitMaterialRequestSchema,
} from "@/lib/validations/project";
import {
  createMaterialRequestService,
  approveMaterialRequestService,
  resubmitMaterialRequestService,
} from "@/lib/services/projectService";
import { requirePermission, requireProjectPermission } from "@/lib/auth/permissions";

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (err) {}

  const defaultUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return defaultUser?.id || "system";
}

export async function createMaterialRequestAction(data: {
  projectId: number;
  engineerId: string;
  remarks?: string;
  items: { inventoryId: number; qtyRequested: number }[];
}) {
  try {
    const user = await requireProjectPermission("material_request.create", data.projectId);
    const actorId = user.id;
    const parsed = createMaterialRequestSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid request payload",
      };
    }

    const request = await createMaterialRequestService(parsed.data, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/material-requests");

    return {
      success: true,
      message: `Material Request ${request.requestNo} submitted successfully!`,
      data: request,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to create material request",
    };
  }
}

export async function approveMaterialRequestAction(data: {
  requestId: number;
  decision?: "APPROVE" | "REJECT";
  items?: { itemId: number; qtyApproved: number }[];
  remarks?: string;
}) {
  try {
    const user = await requirePermission("material_request.approve");
    const actorId = user.id;
    const parsed = approveMaterialRequestSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid approval payload",
      };
    }

    const updated = await approveMaterialRequestService(parsed.data, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${updated.projectId}`);
    revalidatePath("/material-requests");

    return {
      success: true,
      message: `Material Request ${updated.requestNo} status updated to ${updated.status}.`,
      data: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to process request approval",
    };
  }
}

export async function resubmitMaterialRequestAction(data: {
  requestId: number;
  remarks?: string;
  items: { inventoryId: number; qtyRequested: number }[];
}) {
  try {
    const user = await requirePermission("material_request.create");
    const actorId = user.id;
    const parsed = resubmitMaterialRequestSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid payload for resubmission",
      };
    }

    const updated = await resubmitMaterialRequestService(parsed.data, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${updated.projectId}`);
    revalidatePath("/material-requests");

    return {
      success: true,
      message: `Material Request ${updated.requestNo} resubmitted successfully!`,
      data: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to resubmit material request",
    };
  }
}
