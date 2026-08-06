"use server";

// ============================================================
// src/app/actions/tool-assignments.ts
// Server Actions for Tool Assignment Module
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignToolsSchema, returnToolItemSchema } from "@/lib/validations/tool-assignment";
import {
  createToolAssignment,
  returnToolItem,
  getAvailableTools,
} from "@/lib/repositories/toolAssignmentRepository";

// ─── Session Helper ─────────────────────────────────────────────────────────

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // fallback
  }
  const fallback = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return fallback?.id || "system";
}

// ─── Actions ────────────────────────────────────────────────────────────────

/** Assign multiple tools to a project in one batch. */
export async function assignToolsAction(formData: FormData) {
  try {
    const actorId = await getActorId();

    const toolIdsRaw = formData.getAll("toolIds").map((v) => Number(v));

    const raw = {
      projectId: Number(formData.get("projectId")),
      engineerId: formData.get("engineerId") as string,
      assignDate: formData.get("assignDate") as string,
      expectedReturnDate: (formData.get("expectedReturnDate") as string) || undefined,
      remarks: (formData.get("remarks") as string) || null,
      toolIds: toolIdsRaw,
    };

    const parsed = assignToolsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid assignment data.",
      };
    }

    const assignment = await createToolAssignment(parsed.data, actorId);

    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    revalidatePath("/admin/tools");

    return {
      success: true,
      message: `${parsed.data.toolIds.length} tool(s) assigned successfully! (${assignment.assignmentNo})`,
      data: assignment,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to assign tools.",
    };
  }
}

/** Return a single tool item from a project. */
export async function returnToolItemAction(formData: FormData) {
  try {
    const actorId = await getActorId();

    const raw = {
      itemId: Number(formData.get("itemId")),
      condition: formData.get("condition") as string,
      remarks: (formData.get("remarks") as string) || null,
    };

    const parsed = returnToolItemSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid return data.",
      };
    }

    const result = await returnToolItem(parsed.data, actorId);

    // Revalidate both the project page and tools list
    revalidatePath("/dashboard/projects/[id]", "page");
    revalidatePath("/admin/tools");

    return {
      success: true,
      message: `Tool returned successfully. New status: ${result.newStatus}.`,
      data: result,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to return tool.",
    };
  }
}

/** Fetch available tools — used by AssignToolModal client component. */
export async function getAvailableToolsAction() {
  try {
    const tools = await getAvailableTools();
    return { success: true, tools };
  } catch (err: any) {
    return { success: false, tools: [], message: err.message };
  }
}
