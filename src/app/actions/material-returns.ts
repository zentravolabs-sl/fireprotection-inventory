"use server";

// ============================================================
// src/app/actions/material-returns.ts
// Server Actions for Material Returns (Engineer Return)
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { returnMaterialsSchema, ReturnMaterialsInput } from "@/lib/validations/project";
import { returnMaterialsService } from "@/lib/services/projectService";

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

export async function returnMaterialsAction(data: ReturnMaterialsInput) {
  try {
    const actorId = await getActorId();
    const parsed = returnMaterialsSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid return payload",
      };
    }

    const returnHeader = await returnMaterialsService(parsed.data, actorId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/project-stock");
    revalidatePath("/stock-batch");
    revalidatePath("/stock-movement");

    return {
      success: true,
      message: `Materials returned successfully under Return #${returnHeader.returnNo}.`,
      data: returnHeader,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to process material return",
    };
  }
}
