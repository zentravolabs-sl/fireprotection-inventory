"use server";

// ============================================================
// src/app/actions/labour.ts
// Server Actions for the Labour Management Module.
// All mutations are protected by role-based authorization.
// ============================================================

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth/authorization";
import {
  createLabourTypeSchema,
  updateLabourTypeSchema,
  createLabourSchema,
  updateLabourSchema,
  assignLabourSchema,
  updateProjectLabourSchema,
  releaseLabourSchema,
  logOTSchema,
} from "@/lib/validations/labour";
import {
  createLabourTypeService,
  updateLabourTypeService,
  deleteLabourTypeService,
  restoreLabourTypeService,
  createLabourService,
  updateLabourService,
  deactivateLabourService,
  reactivateLabourService,
  assignLabourService,
  updateLabourAssignmentService,
  releaseLabourService,
  logOTService,
  deleteOTService,
} from "@/lib/services/labourService";

// ─── Labour Type Actions ─────────────────────────────────────────────────────

export async function createLabourTypeAction(formData: FormData) {
  try {
    const actor = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const raw = {
      name: formData.get("name") as string,
      description: formData.get("description") as string | null || null,
    };

    const parsed = createLabourTypeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await createLabourTypeService(parsed.data);
    revalidatePath("/admin/labour-types");
    return { success: true, message: `Labour type "${result.name}" created.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create labour type" };
  }
}

export async function updateLabourTypeAction(formData: FormData) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const raw = {
      id: Number(formData.get("id")),
      name: formData.get("name") as string,
      description: formData.get("description") as string | null || null,
    };

    const parsed = updateLabourTypeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await updateLabourTypeService(parsed.data);
    revalidatePath("/admin/labour-types");
    return { success: true, message: `Labour type updated to "${result.name}".`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update labour type" };
  }
}

export async function deleteLabourTypeAction(id: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
    await deleteLabourTypeService(id);
    revalidatePath("/admin/labour-types");
    return { success: true, message: "Labour type deactivated." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to deactivate labour type" };
  }
}

export async function restoreLabourTypeAction(id: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
    await restoreLabourTypeService(id);
    revalidatePath("/admin/labour-types");
    return { success: true, message: "Labour type restored." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to restore labour type" };
  }
}

// ─── Labour Master Actions ────────────────────────────────────────────────────

export async function createLabourAction(formData: FormData) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const raw = {
      name: formData.get("name") as string,
      labourTypeId: Number(formData.get("labourTypeId")),
      nic: formData.get("nic") as string | null || null,
      phone: formData.get("phone") as string | null || null,
      monthlySalary: Number(formData.get("monthlySalary") || 0),
    };

    const parsed = createLabourSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await createLabourService(parsed.data);
    revalidatePath("/admin/labour");
    return {
      success: true,
      message: `Labour "${result.name}" (${result.labourCode}) created.`,
      data: result,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create labour" };
  }
}

export async function updateLabourAction(formData: FormData) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const id = Number(formData.get("id"));
    const raw = {
      id,
      name: formData.get("name") as string,
      labourTypeId: Number(formData.get("labourTypeId")),
      nic: formData.get("nic") as string | null || null,
      phone: formData.get("phone") as string | null || null,
      monthlySalary: Number(formData.get("monthlySalary") || 0),
    };

    const parsed = updateLabourSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await updateLabourService(id, parsed.data);
    revalidatePath("/admin/labour");
    return { success: true, message: `Labour "${result.name}" updated.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update labour" };
  }
}

export async function deactivateLabourAction(id: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
    await deactivateLabourService(id);
    revalidatePath("/admin/labour");
    return { success: true, message: "Labour deactivated." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to deactivate labour" };
  }
}

export async function reactivateLabourAction(id: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
    await reactivateLabourService(id);
    revalidatePath("/admin/labour");
    return { success: true, message: "Labour reactivated." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to reactivate labour" };
  }
}

// ─── Project Labour Assignment Actions ───────────────────────────────────────

export async function assignLabourAction(data: {
  projectId: number;
  labourId: number;
  labourCost: number;
  startDate?: string | null;
  endDate?: string | null;
  remarks?: string | null;
}) {
  try {
    const actor = await requireAnyRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER", "ENGINEER"]);

    const parsed = assignLabourSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await assignLabourService(parsed.data, actor.id);
    revalidatePath(`/dashboard/projects/${data.projectId}`);
    return { success: true, message: "Labour assigned to project.", data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to assign labour" };
  }
}

export async function updateLabourAssignmentAction(data: {
  id: number;
  labourCost: number;
  startDate?: string | null;
  endDate?: string | null;
  remarks?: string | null;
}, projectId: number) {
  try {
    const actor = await requireAnyRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"]);

    const parsed = updateProjectLabourSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await updateLabourAssignmentService(parsed.data, actor.id);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: "Assignment updated.", data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update assignment" };
  }
}

export async function releaseLabourAction(projectLabourId: number, projectId: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"]);
    await releaseLabourService(projectLabourId);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: "Labour released from project." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to release labour" };
  }
}

// ─── OT Actions ──────────────────────────────────────────────────────────────

export async function logOTAction(data: {
  projectLabourId: number;
  otDate: string;
  otHours: number;
  otRatePerHour: number;
  remarks?: string | null;
}, projectId: number) {
  try {
    const actor = await requireAnyRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER", "ENGINEER"]);

    const parsed = logOTSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid data" };
    }

    const result = await logOTService(parsed.data, actor.id);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: `OT logged: ${result.otHours}h × ${result.otRatePerHour} = ${result.otAmount}`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to log OT" };
  }
}

export async function deleteOTAction(otId: number, projectId: number) {
  try {
    await requireAnyRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"]);
    await deleteOTService(otId);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: "OT record deleted." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete OT record" };
  }
}
