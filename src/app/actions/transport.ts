"use server";

// ============================================================
// src/app/actions/transport.ts
// Server Actions for Project Transportation
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransportSchema } from "@/lib/validations/project";
import {
  generateTransportNo,
  createTransportRecord,
} from "@/lib/repositories/transportRepository";

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (err) {
    // Fallback to active admin user for demo resilience
  }

  const defaultUser = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return defaultUser?.id || "system";
}

export async function createTransportAction(formData: FormData) {
  try {
    const actorId = await getActorId();

    const fuelCost = Number(formData.get("fuelCost") || 0);
    const vehicleHireCost = Number(formData.get("vehicleHireCost") || 0);
    const loadingCost = Number(formData.get("loadingCost") || 0);
    const unloadingCost = Number(formData.get("unloadingCost") || 0);
    const otherCost = Number(formData.get("otherCost") || 0);
    const totalCost = fuelCost + vehicleHireCost + loadingCost + unloadingCost + otherCost;

    const raw = {
      projectId: Number(formData.get("projectId")),
      transportDate: formData.get("transportDate") || undefined,
      vehicleNumber: formData.get("vehicleNumber"),
      driverName: formData.get("driverName"),
      transportCompany: formData.get("transportCompany") || undefined,
      fromLocation: formData.get("fromLocation"),
      toLocation: formData.get("toLocation"),
      fuelCost,
      vehicleHireCost,
      loadingCost,
      unloadingCost,
      otherCost,
      remarks: formData.get("remarks") || undefined,
    };

    const parsed = createTransportSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid transport data",
      };
    }

    const transportNo = await generateTransportNo();

    const { transport, needsApproval, createdExpense } = await createTransportRecord({
      transportNo,
      projectId: parsed.data.projectId,
      transportDate: parsed.data.transportDate ? new Date(parsed.data.transportDate) : new Date(),
      vehicleNumber: parsed.data.vehicleNumber,
      driverName: parsed.data.driverName,
      transportCompany: parsed.data.transportCompany || null,
      fromLocation: parsed.data.fromLocation,
      toLocation: parsed.data.toLocation,
      fuelCost,
      vehicleHireCost,
      loadingCost,
      unloadingCost,
      otherCost,
      totalCost,
      remarks: parsed.data.remarks || null,
      createdBy: actorId,
    });

    if (needsApproval && createdExpense) {
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true },
      });
      const project = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { projectName: true },
      });

      const { notifyCostThresholdPendingApproval } = await import("@/lib/notifications");
      await notifyCostThresholdPendingApproval(
        createdExpense.id,
        createdExpense.expenseNo,
        parsed.data.projectId,
        project?.projectName || `Project #${parsed.data.projectId}`,
        totalCost,
        actor?.name || "A team member",
      );
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    revalidatePath("/cost-approvals");

    if (needsApproval) {
      return {
        success: true,
        requiresApproval: true,
        message: `Transport record ${transport.transportNo} logged! Since current month project actual cost reached LKR 5,000,000, the TRANSPORT expense is held for Admin approval before updating actual cost.`,
        data: transport,
      };
    }

    return {
      success: true,
      requiresApproval: false,
      message: `Transport record ${transport.transportNo} created successfully! Automatic TRANSPORT expense logged.`,
      data: transport,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to create transport record",
    };
  }
}
