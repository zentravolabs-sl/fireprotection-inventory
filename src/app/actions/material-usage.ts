"use server";

// ============================================================
// src/app/actions/material-usage.ts
// Server action for recording actual material usage on a project
// ============================================================

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Update the usedQty (actual quantity consumed/installed on site)
 * for a given ProjectMaterial record.
 * Only SUPER_ADMIN, ADMIN, ENGINEER, and INVENTORY_CONTROLLER roles are allowed.
 *
 * IMPORTANT: Next.js redirect() throws a special NEXT_REDIRECT internal error.
 * If that error is caught inside a try/catch it gets corrupted and causes
 * better-auth's db[model].findFirst() to fail, logging the user out.
 * The session check is therefore placed OUTSIDE the try/catch so the redirect
 * can propagate freely through the framework.
 */
export async function updateMaterialUsageAction(
  projectId: number,
  projectMaterialId: number,
  usedQty: number
) {
  // ── Auth guard — MUST be outside try/catch so redirect() can propagate ──────
  const session = await getSession();
  if (!session?.user || (session.user as any).isActive === false) {
    redirect("/login");
  }

  const role = (session.user as any).role as string;
  const allowedRoles = ["SUPER_ADMIN", "ENGINEER", "ADMIN", "INVENTORY_CONTROLLER"];
  if (!allowedRoles.includes(role)) {
    return {
      success: false,
      message: "You do not have permission to record material usage.",
    };
  }

  // ── DB work — safe to wrap in try/catch ──────────────────────────────────────
  try {
    if (isNaN(usedQty) || usedQty < 0) {
      return { success: false, message: "Used quantity must be 0 or greater." };
    }

    const mat = await prisma.projectMaterial.findFirst({
      where: { id: projectMaterialId, projectId },
    });

    if (!mat) {
      return { success: false, message: "Material record not found." };
    }

    if (usedQty > mat.issuedQty) {
      return {
        success: false,
        message: `Used quantity (${usedQty}) cannot exceed issued quantity (${mat.issuedQty}).`,
      };
    }

    // Net available = issued minus already returned
    const netAvailable = mat.issuedQty - mat.returnedQty;

    // Recalculate balanceQty: what remains on-site = net available - used
    const newBalanceQty = Math.max(0, netAvailable - usedQty);

    await prisma.projectMaterial.update({
      where: { id: projectMaterialId },
      data: {
        usedQty,
        balanceQty: newBalanceQty,
      },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, message: "Material usage updated successfully." };
  } catch (err: any) {
    // Always re-throw Next.js internal redirect/not-found errors
    if (isRedirectError(err)) throw err;
    return {
      success: false,
      message: err.message || "Failed to update material usage.",
    };
  }
}
