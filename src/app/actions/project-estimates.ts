"use server";

// ============================================================
// src/app/actions/project-estimates.ts
// Server Actions for Project Estimated Materials & Material Summaries
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveProjectEstimateSchema } from "@/lib/validations/project";
import { requireProjectPermission, requirePermission } from "@/lib/auth/permissions";

export async function saveProjectEstimateAction(data: {
  projectId: number;
  inventoryId: number;
  estimatedQty: number;
  notes?: string;
}) {
  try {
    await requireProjectPermission("project_material.manage_estimate", data.projectId);
    const parsed = saveProjectEstimateSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid estimate data",
      };
    }

    const estimate = await prisma.projectEstimateMaterial.upsert({
      where: {
        projectId_inventoryId: {
          projectId: data.projectId,
          inventoryId: data.inventoryId,
        },
      },
      update: {
        estimatedQty: data.estimatedQty,
        notes: data.notes || null,
      },
      create: {
        projectId: data.projectId,
        inventoryId: data.inventoryId,
        estimatedQty: data.estimatedQty,
        notes: data.notes || null,
      },
    });

    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath("/projects");

    return {
      success: true,
      message: "Estimated material quantity saved successfully!",
      data: estimate,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to save material estimate",
    };
  }
}

export async function deleteProjectEstimateAction(projectId: number, estimateId: string) {
  try {
    await requireProjectPermission("project_material.manage_estimate", projectId);

    await prisma.projectEstimateMaterial.delete({
      where: { id: estimateId },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      success: true,
      message: "Material estimate removed successfully!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to delete material estimate",
    };
  }
}

export async function getProjectMaterialSummariesAction(projectId: number) {
  try {
    await requireProjectPermission("project_material.view", projectId);

    const [estimates, requests, projectMaterials, returnItems] = await Promise.all([
      prisma.projectEstimateMaterial.findMany({
        where: { projectId },
        include: { inventory: true },
      }),
      prisma.materialRequest.findMany({
        where: { projectId, status: { not: "REJECTED" } },
        include: { items: true },
      }),
      prisma.projectMaterial.findMany({
        where: { projectId },
        include: { inventory: true },
      }),
      prisma.materialReturnItem.findMany({
        where: { materialReturn: { projectId } },
      }),
    ]);

    const inventoryMap = new Map<number, {
      inventoryId: number;
      itemCode: string;
      name: string;
      totalEstimatedQty: number;
      totalRequestedQty: number;
      totalIssuedQty: number;
      totalReturnedQty: number;
    }>();

    // Helper to get or create map entry
    const getEntry = (inv: { id: number; itemCode: string; name: string }) => {
      if (!inventoryMap.has(inv.id)) {
        inventoryMap.set(inv.id, {
          inventoryId: inv.id,
          itemCode: inv.itemCode,
          name: inv.name,
          totalEstimatedQty: 0,
          totalRequestedQty: 0,
          totalIssuedQty: 0,
          totalReturnedQty: 0,
        });
      }
      return inventoryMap.get(inv.id)!;
    };

    // 1. Accumulate estimates
    estimates.forEach((est) => {
      const entry = getEntry(est.inventory);
      entry.totalEstimatedQty += est.estimatedQty;
    });

    // 2. Accumulate requested quantities
    requests.forEach((req) => {
      req.items.forEach((item) => {
        if (inventoryMap.has(item.inventoryId)) {
          const entry = inventoryMap.get(item.inventoryId)!;
          entry.totalRequestedQty += item.qtyRequested;
        }
      });
    });

    // 3. Accumulate issued quantities
    projectMaterials.forEach((pm) => {
      const entry = getEntry(pm.inventory);
      entry.totalIssuedQty += pm.issuedQty;
    });

    // 4. Accumulate returned quantities
    returnItems.forEach((ret) => {
      if (inventoryMap.has(ret.inventoryId)) {
        const entry = inventoryMap.get(ret.inventoryId)!;
        entry.totalReturnedQty += ret.qtyReturned;
      }
    });

    const summaryRows = Array.from(inventoryMap.values()).map((row) => {
      const netIssued = Math.max(0, row.totalIssuedQty - row.totalReturnedQty);
      return {
        ...row,
        remainingToRequest: Math.max(0, row.totalEstimatedQty - row.totalRequestedQty),
        remainingToIssue: Math.max(0, row.totalRequestedQty - netIssued),
      };
    });

    return {
      success: true,
      data: summaryRows,
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      message: err.message || "Failed to load material summary",
    };
  }
}
