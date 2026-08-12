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
} from "@/lib/validations/project";
import {
  createMaterialRequestService,
  approveMaterialRequestService,
} from "@/lib/services/projectService";

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
    const actorId = await getActorId();
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
  items: { itemId: number; qtyApproved: number }[];
  remarks?: string;
}) {
  try {
    const actorId = await getActorId();
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
