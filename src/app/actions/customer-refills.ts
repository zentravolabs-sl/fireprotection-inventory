"use server";

// ============================================================
// src/app/actions/customer-refills.ts
// Server Actions — Customer-Owned Fire Extinguisher Refills
// ============================================================

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { withActionError } from "@/lib/errors";
import { getCurrentUserPermissions } from "@/lib/auth/permissions";
import {
  createCustomerRefillSchema,
  completeReturnSchema,
} from "@/lib/validations/customer-refill";
import {
  createCustomerRefillService,
  startRefillService,
  markRefillReadyService,
  completeRefillReturnService,
  getCustomerRefillsService,
  getCustomerRefillByIdService,
  getExpiringRefillItemsService,
} from "@/lib/services/customerRefillService";
import type { ActionState } from "@/types/auth";

async function getActorId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {}
  const fallback = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } });
  return fallback?.id ?? "system";
}

async function requirePerm(key: string): Promise<void> {
  const perms = await getCurrentUserPermissions();
  if (!perms.has(key)) throw new Error("You do not have permission to perform this action.");
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCustomerRefillAction(data: unknown): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.create");
    const actorId = await getActorId();
    const parsed = createCustomerRefillSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Validation failed." };
    }

    const refill = await createCustomerRefillService(parsed.data, actorId);
    revalidatePath("/fire-extinguishers/customer-refills");
    revalidatePath("/inventory");
    revalidatePath("/stock-movement");

    return {
      success: true,
      message: `Customer Refill Job '${refill.refillNo}' created successfully.`,
      data: refill,
    };
  });
}

// ─── Start Refill ─────────────────────────────────────────────────────────────

export async function startCustomerRefillAction(refillId: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.startRefill");
    const refill = await startRefillService(refillId);
    revalidatePath("/fire-extinguishers/customer-refills");
    revalidatePath(`/fire-extinguishers/customer-refills/${refillId}`);
    return { success: true, message: `${refill.refillNo} started — IN PROGRESS.`, data: refill };
  });
}

// ─── Mark Ready ───────────────────────────────────────────────────────────────

export async function markCustomerRefillReadyAction(refillId: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.edit");
    const refill = await markRefillReadyService(refillId);
    revalidatePath("/fire-extinguishers/customer-refills");
    revalidatePath(`/fire-extinguishers/customer-refills/${refillId}`);
    return {
      success: true,
      message: `${refill.refillNo} marked as READY TO RETURN.`,
      data: refill,
    };
  });
}

// ─── Complete & Return ────────────────────────────────────────────────────────

export async function completeCustomerRefillReturnAction(data: unknown): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.complete");
    const actorId = await getActorId();
    const parsed = completeReturnSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Validation failed." };
    }

    const refill = await completeRefillReturnService(parsed.data, actorId);
    revalidatePath("/fire-extinguishers/customer-refills");
    revalidatePath(`/fire-extinguishers/customer-refills/${parsed.data.refillId}`);
    revalidatePath("/inventory");
    revalidatePath("/stock-movement");

    return {
      success: true,
      message: `Return processed for '${refill.refillNo}'. Status: ${refill.status}`,
      data: refill,
    };
  });
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getCustomerRefillsAction(filters?: {
  tab?: "ALL" | "DRAFT" | "RECEIVED" | "IN_PROGRESS" | "READY_TO_RETURN" | "COMPLETED" | "CANCELLED";
  search?: string;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.view");
    const data = await getCustomerRefillsService(filters);
    return { success: true, message: "Fetched.", data };
  });
}

// ─── Get By ID ────────────────────────────────────────────────────────────────

export async function getCustomerRefillByIdAction(id: number): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.view");
    const data = await getCustomerRefillByIdService(id);
    return { success: true, message: "Fetched.", data };
  });
}

// ─── Expiring Items (within 30 days) ──────────────────────────────────────────────────

export async function getExpiringRefillItemsAction(): Promise<ActionState> {
  return withActionError(async () => {
    await requirePerm("customerRefills.view");
    const data = await getExpiringRefillItemsService(30);
    return { success: true, message: "Fetched.", data };
  });
}
