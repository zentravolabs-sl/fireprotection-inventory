"use server";

// ============================================================
// src/app/(Main)/expiry/actions.ts
// Server Actions for Expiry Management with Better Auth role authorization.
// ============================================================

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  getExpiryDashboardData,
  getExpiryBatches,
  getExpiryReportData,
  getSupplierExpiryReportData,
  getExpiryCalendarEvents,
  getBatchExpiryDetails,
  setSystemExpiryThreshold,
  checkAndCreateExpiryNotifications,
  type ExpiryDashboardSummary,
  type SupplierExpirySummary,
  type ExpiryCalendarEvent,
} from "@/lib/services/expiryService";
import {
  expiryFilterSchema,
  updateExpirySettingSchema,
  type ExpiryFilterInput,
} from "@/lib/validations/expiry";
import type { ActionState } from "@/types/auth";
import type { Role } from "@/generated/prisma/client";

const EXPIRY_PATH = "/expiry";

// ── Auth Helper ───────────────────────────────────────────────────────────────

async function checkUserRole(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized access. Please log in.");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      throw new Error(`Permission denied for role: ${userRole}.`);
    }
  }

  return session;
}

// ── Server Actions ────────────────────────────────────────────────────────────

export async function getExpiryDashboardAction(
  overrideThreshold?: number
): Promise<ActionState<ExpiryDashboardSummary>> {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "ENGINEER", "USER"]);
    const data = await getExpiryDashboardData(overrideThreshold);
    return { success: true, message: "Dashboard loaded.", data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load expiry dashboard.";
    return { success: false, message: msg };
  }
}

export async function getExpiryBatchesAction(rawFilters?: ExpiryFilterInput) {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "ENGINEER", "USER"]);
    const parsed = expiryFilterSchema.parse(rawFilters || {});
    const result = await getExpiryBatches(parsed);
    return { success: true, message: "Batches loaded.", data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load expiry batches.";
    return { success: false, message: msg };
  }
}

export async function getExpiryReportAction(rawFilters?: ExpiryFilterInput) {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);
    const parsed = expiryFilterSchema.parse(rawFilters || {});
    const result = await getExpiryReportData(parsed);
    return { success: true, message: "Expiry report loaded.", data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load expiry report.";
    return { success: false, message: msg };
  }
}

export async function getSupplierExpiryReportAction(rawFilters?: ExpiryFilterInput): Promise<ActionState<SupplierExpirySummary[]>> {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);
    const parsed = expiryFilterSchema.parse(rawFilters || {});
    const result = await getSupplierExpiryReportData(parsed);
    return { success: true, message: "Supplier report loaded.", data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load supplier expiry report.";
    return { success: false, message: msg };
  }
}

export async function getExpiryCalendarEventsAction(
  month: number,
  year: number
): Promise<ActionState<ExpiryCalendarEvent[]>> {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "ENGINEER"]);
    const data = await getExpiryCalendarEvents(month, year);
    return { success: true, message: "Calendar loaded.", data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load calendar events.";
    return { success: false, message: msg };
  }
}

export async function getBatchExpiryDetailsAction(batchId: number) {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "ENGINEER", "USER"]);
    const data = await getBatchExpiryDetails(batchId);
    if (!data) return { success: false, message: "Batch not found." };
    return { success: true, message: "Batch details loaded.", data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load batch details.";
    return { success: false, message: msg };
  }
}

export async function updateExpiryThresholdSettingAction(formData: unknown): Promise<ActionState> {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN"]);
    const parsed = updateExpirySettingSchema.parse(formData);
    await setSystemExpiryThreshold(parsed.thresholdDays);
    revalidatePath(EXPIRY_PATH);
    revalidatePath(`${EXPIRY_PATH}/reports`);
    return { success: true, message: `Expiry alert threshold updated to ${parsed.thresholdDays} days.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update threshold setting.";
    return { success: false, message: msg };
  }
}

export async function triggerExpiryCheckAction(): Promise<ActionState<{ createdCount: number }>> {
  try {
    await checkUserRole(["SUPER_ADMIN", "ADMIN"]);
    const result = await checkAndCreateExpiryNotifications();
    return { success: true, message: `Expiry check completed. ${result.createdCount} notification(s) generated.`, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to trigger expiry notification check.";
    return { success: false, message: msg };
  }
}
