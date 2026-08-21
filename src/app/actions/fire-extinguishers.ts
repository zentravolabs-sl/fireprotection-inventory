"use server";

// ============================================================
// src/app/actions/fire-extinguishers.ts
// Server Actions for Fire Extinguisher Module.
// ============================================================

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth/permissions";
import {
  createFireExtinguisherUnitSchema,
  updateFireExtinguisherUnitSchema,
  createDeliveryNoteSchema,
  updateDeliveryNoteSchema,
  startRefillSchema,
  completeRefillSchema,
  returnUnitSchema,
  assignUnitSchema,
} from "@/lib/validations/fire-extinguisher";
import {
  createFireExtinguisherUnitService,
  updateFireExtinguisherUnitService,
  getFireExtinguisherUnitsService,
  getFireExtinguisherUnitByCodeService,
  createDeliveryNoteService,
  updateDeliveryNoteService,
  confirmDeliveryNoteService,
  cancelDeliveryNoteService,
  getDeliveryNotesService,
  getDeliveryNoteByIdService,
  startRefillService,
  completeRefillService,
  getRefillsService,
  returnFireExtinguisherService,
  assignFireExtinguisherService,
  getFireExtinguisherAssignmentsService,
  getFireExtinguisherDashboardStatsService,
} from "@/lib/services/fireExtinguisherService";
import type { ActionState } from "@/types/auth";
import type { FireExtinguisherUnitStatus, DeliveryStatus, FireExtinguisherAssignmentStatus } from "@/generated/prisma/client";

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

// ─── 1. Unit Actions ─────────────────────────────────────────────────────────

export async function createFireExtinguisherUnitAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.manage");
    const actorId = await getActorId();
    const parsed = createFireExtinguisherUnitSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const unit = await createFireExtinguisherUnitService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/units");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/inventory");

    return {
      success: true,
      message: `Fire Extinguisher Unit '${unit.unitCode}' created successfully.`,
      data: unit,
    };
  });
}

export async function updateFireExtinguisherUnitAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.manage");
    const actorId = await getActorId();
    const parsed = updateFireExtinguisherUnitSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const unit = await updateFireExtinguisherUnitService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/units");
    revalidatePath(`/fire-extinguishers/${unit.unitCode}`);

    return {
      success: true,
      message: `Unit '${unit.unitCode}' updated successfully.`,
      data: unit,
    };
  });
}

export async function getFireExtinguisherUnitsAction(filters?: {
  search?: string;
  status?: FireExtinguisherUnitStatus | "";
  inventoryId?: number;
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const units = await getFireExtinguisherUnitsService(filters);
    return {
      success: true,
      message: "Units fetched.",
      data: units,
    };
  });
}

export async function getFireExtinguisherUnitByCodeAction(unitCode: string): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const data = await getFireExtinguisherUnitByCodeService(unitCode);
    return {
      success: true,
      message: "Unit details fetched.",
      data,
    };
  });
}

// ─── 2. Delivery Note Actions ────────────────────────────────────────────────

export async function createDeliveryNoteAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.deliver");
    const actorId = await getActorId();
    const parsed = createDeliveryNoteSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const note = await createDeliveryNoteService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/deliveries");

    return {
      success: true,
      message: `Client Delivery Note '${note.deliveryNo}' created as Draft.`,
      data: note,
    };
  });
}

export async function updateDeliveryNoteAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.deliver");
    const actorId = await getActorId();
    const parsed = updateDeliveryNoteSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const note = await updateDeliveryNoteService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers/deliveries");

    return {
      success: true,
      message: `Delivery Note '${note.deliveryNo}' updated successfully.`,
      data: note,
    };
  });
}

export async function confirmDeliveryNoteAction(deliveryNoteId: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.deliver");
    const actorId = await getActorId();
    const note = await confirmDeliveryNoteService(deliveryNoteId, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/deliveries");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");
    revalidatePath("/stock-movement");

    return {
      success: true,
      message: `Delivery Note '${note.deliveryNo}' confirmed & delivered. Units assigned to ${note.customer.companyName}.`,
      data: note,
    };
  });
}

export async function cancelDeliveryNoteAction(deliveryNoteId: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.deliver");
    const actorId = await getActorId();
    const note = await cancelDeliveryNoteService(deliveryNoteId, actorId);

    revalidatePath("/fire-extinguishers/deliveries");

    return {
      success: true,
      message: `Delivery Note '${note.deliveryNo}' cancelled.`,
      data: note,
    };
  });
}

export async function getDeliveryNotesAction(filters?: {
  search?: string;
  customerId?: number;
  status?: DeliveryStatus | "";
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const notes = await getDeliveryNotesService(filters);
    return {
      success: true,
      message: "Delivery notes fetched.",
      data: notes,
    };
  });
}

export async function getDeliveryNoteByIdAction(id: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const note = await getDeliveryNoteByIdService(id);
    return {
      success: true,
      message: "Delivery note fetched.",
      data: note,
    };
  });
}

// ─── 3. Refill Actions ───────────────────────────────────────────────────────

export async function startRefillAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.refill");
    const actorId = await getActorId();
    const parsed = startRefillSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const payload = {
      ...parsed.data,
      replacementUnitId: parsed.data.replacementUnitId && parsed.data.replacementUnitId > 0 ? parsed.data.replacementUnitId : undefined,
    };

    const refill = await startRefillService(payload, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/refills");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");

    return {
      success: true,
      message: `Refill process started for assignment #${refill.fireExtinguisherAssignmentId}.`,
      data: refill,
    };
  });
}

/**
 * Bulk start refill process for multiple active assignments at once.
 */
export async function bulkStartRefillAction(data: {
  assignmentIds: number[];
  receivedDate: string;
  notes?: string;
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.refill");
    const actorId = await getActorId();

    if (!data.assignmentIds || data.assignmentIds.length === 0) {
      return { success: false, message: "Please select at least one unit to send for refill." };
    }

    const results: { assignmentId: number; success: boolean; error?: string }[] = [];

    for (const assignmentId of data.assignmentIds) {
      try {
        const payload = {
          assignmentId,
          receivedDate: data.receivedDate,
          notes: data.notes?.trim() || undefined,
        };

        const parsed = startRefillSchema.safeParse(payload);
        if (!parsed.success) {
          results.push({ assignmentId, success: false, error: parsed.error.issues[0]?.message });
          continue;
        }

        await startRefillService(parsed.data, actorId);
        results.push({ assignmentId, success: true });
      } catch (err: any) {
        results.push({ assignmentId, success: false, error: err?.message || "Unknown error" });
      }
    }

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/refills");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (succeeded === 0) {
      return {
        success: false,
        message: `All ${failed} unit(s) failed to start refill. ${results.find((r) => r.error)?.error || ""}`,
        data: results,
      };
    }

    return {
      success: true,
      message:
        failed === 0
          ? `${succeeded} unit(s) sent for refill successfully.`
          : `${succeeded} unit(s) sent for refill. ${failed} unit(s) failed.`,
      data: results,
    };
  });
}


export async function completeRefillAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.refill");
    const actorId = await getActorId();
    const parsed = completeRefillSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const refill = await completeRefillService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/refills");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");

    return {
      success: true,
      message: `Refill #${refill.id} completed successfully. Unit restored to Active.`,
      data: refill,
    };
  });
}

export async function getRefillsAction(statusTab?: "UNDER_REFILL" | "HISTORY" | "COMPLETED"): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const refills = await getRefillsService(statusTab);
    return {
      success: true,
      message: "Refill records fetched.",
      data: refills,
    };
  });
}

// ─── 4. Return & Assign Actions ──────────────────────────────────────────────

export async function returnFireExtinguisherAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.return");
    const actorId = await getActorId();
    const parsed = returnUnitSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const assignment = await returnFireExtinguisherService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");
    revalidatePath("/stock-movement");

    return {
      success: true,
      message: `Fire Extinguisher returned to warehouse successfully.`,
      data: assignment,
    };
  });
}

export async function assignFireExtinguisherAction(data: any): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.assign");
    const actorId = await getActorId();

    const rawPayload = {
      ...data,
      projectId: data.projectId && Number(data.projectId) > 0 ? Number(data.projectId) : undefined,
      customerId: data.customerId && Number(data.customerId) > 0 ? Number(data.customerId) : undefined,
    };

    const parsed = assignUnitSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const assignment = await assignFireExtinguisherService(parsed.data, actorId);

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");

    return {
      success: true,
      message: `Fire Extinguisher unit assigned successfully.`,
      data: assignment,
    };
  });
}

/**
 * Bulk assign multiple fire extinguisher units to the same project or customer in one action.
 * Processes each unit sequentially. Returns a summary of successes and failures.
 */
export async function bulkAssignFireExtinguisherAction(data: {
  unitIds: number[];
  projectId?: number;
  customerId?: number;
  location?: string;
  notes?: string;
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.assign");
    const actorId = await getActorId();

    if (!data.unitIds || data.unitIds.length === 0) {
      return { success: false, message: "Please select at least one unit to assign." };
    }

    const results: { unitId: number; success: boolean; error?: string }[] = [];

    for (const unitId of data.unitIds) {
      try {
        const rawPayload = {
          unitId,
          projectId: data.projectId && Number(data.projectId) > 0 ? Number(data.projectId) : undefined,
          customerId: data.customerId && Number(data.customerId) > 0 ? Number(data.customerId) : undefined,
          location: data.location?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        };

        const parsed = assignUnitSchema.safeParse(rawPayload);
        if (!parsed.success) {
          results.push({ unitId, success: false, error: parsed.error.issues[0]?.message });
          continue;
        }

        await assignFireExtinguisherService(parsed.data, actorId);
        results.push({ unitId, success: true });
      } catch (err: any) {
        results.push({ unitId, success: false, error: err?.message || "Unknown error" });
      }
    }

    revalidatePath("/fire-extinguishers");
    revalidatePath("/fire-extinguishers/assignments");
    revalidatePath("/fire-extinguishers/units");

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (succeeded === 0) {
      return {
        success: false,
        message: `All ${failed} unit(s) failed to assign. ${results.find((r) => r.error)?.error || ""}`,
        data: results,
      };
    }

    return {
      success: true,
      message:
        failed === 0
          ? `${succeeded} unit(s) assigned successfully.`
          : `${succeeded} unit(s) assigned. ${failed} unit(s) failed.`,
      data: results,
    };
  });
}


export async function getFireExtinguisherAssignmentsAction(filters?: {
  tab?: "ALL" | "PROJECTS" | "CUSTOMERS" | "ACTIVE" | "UNDER_REFILL" | "RETURNED";
  search?: string;
  status?: FireExtinguisherAssignmentStatus | "";
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const assignments = await getFireExtinguisherAssignmentsService(filters);
    return {
      success: true,
      message: "Assignments fetched.",
      data: assignments,
    };
  });
}

export async function getFireExtinguisherDashboardStatsAction(): Promise<ActionState> {
  return withActionError(async () => {
    await requirePermission("fire_extinguisher.view");
    const stats = await getFireExtinguisherDashboardStatsService();
    return {
      success: true,
      message: "Dashboard stats fetched.",
      data: stats,
    };
  });
}
