"use server";

// ============================================================
// src/app/actions/material-issues.ts
// Server Actions for Material Issues (Store Keeper FIFO)
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueMaterialsFIFOSchema } from "@/lib/validations/project";
import { issueMaterialsFIFOService } from "@/lib/services/projectService";

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

export async function issueMaterialsFIFOAction(data: {
  requestId: number;
  warehouse?: string;
}) {
  try {
    const actorId = await getActorId();
    const parsed = issueMaterialsFIFOSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid issue payload",
      };
    }

    const issue = await issueMaterialsFIFOService(parsed.data, actorId);

    const req = await prisma.materialRequest.findUnique({
      where: { id: data.requestId },
      select: { projectId: true },
    });

    if (req?.projectId) {
      revalidatePath(`/projects/${req.projectId}`);
    }

    revalidatePath("/projects");
    revalidatePath("/material-requests");
    revalidatePath("/project-stock");
    revalidatePath("/stock-batch");
    revalidatePath("/stock-movement");
    revalidatePath("/super-admin");

    return {
      success: true,
      message: `Materials issued successfully under Issue #${issue.issueNo}. (Automatic MATERIAL expense logged and evaluated against 5M threshold).`,
      data: issue,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to issue materials",
    };
  }
}
