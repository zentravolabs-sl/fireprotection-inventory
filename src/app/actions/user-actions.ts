"use server";

// ============================================================
// src/app/actions/user-actions.ts
// Server Actions for User Management.
//
// All mutating actions require SUPER_ADMIN or ADMIN roles.
// Passwords are handled entirely by Better Auth — never stored
// or logged as plain text.
// Audit events are written to AuditLog on every mutation.
// ============================================================

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withActionError } from "@/lib/errors";
import { canManageRole } from "@/lib/auth/authorization";
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
} from "@/lib/validations/user";
import { hashPassword } from "better-auth/crypto";
import type { ActionState, UserRole, UserProfile } from "@/types/auth";

// ── Helpers ────────────────────────────────────────────────

/**
 * Extracts flat field-level errors from a Zod parse failure.
 */
function extractZodErrors(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (!errors[field]) errors[field] = [];
    errors[field].push(issue.message);
  }
  return errors;
}

/**
 * Write an immutable entry to the AuditLog table.
 * Non-fatal: logs to console on failure but does not throw.
 */
async function logAuditEvent(
  action: string,
  userId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}

/**
 * Gets the current actor from the session for RBAC checks.
 * Throws if unauthenticated or inactive.
 */
async function getActor(): Promise<{ id: string; role: UserRole }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized: you must be signed in.");
  }
  const user = session.user as { id: string; role?: UserRole; isActive?: boolean };
  if (user.isActive === false) {
    throw new Error("Unauthorized: your account is inactive.");
  }
  return { id: user.id, role: (user.role ?? "USER") as UserRole };
}

/**
 * Asserts the actor has one of the allowed roles, or throws.
 */
async function assertAnyRole(
  allowed: UserRole[],
): Promise<{ id: string; role: UserRole }> {
  const actor = await getActor();
  if (!allowed.includes(actor.role)) {
    throw new Error("Forbidden: insufficient permissions.");
  }
  return actor;
}

// ── Query Helpers ──────────────────────────────────────────

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  isActive: true,
  employeeCode: true,
  phone: true,
  designation: true,
  department: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// ── getUsers ───────────────────────────────────────────────

export interface GetUsersFilters {
  search?: string;
  role?: UserRole | "";
  isActive?: "true" | "false" | "";
}

export interface GetUsersResult {
  users: UserProfile[];
  total: number;
}

/**
 * Lists all users with optional search, role, and status filters.
 * Requires SUPER_ADMIN or ADMIN.
 */
export async function getUsers(
  filters: GetUsersFilters = {},
): Promise<ActionState<GetUsersResult>> {
  return withActionError(async () => {
    await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { employeeCode: { contains: term, mode: "insensitive" } },
        { designation: { contains: term, mode: "insensitive" } },
      ];
    }

    if (filters.role) {
      where.role = filters.role as UserRole;
    }

    if (filters.isActive === "true") {
      where.isActive = true;
    } else if (filters.isActive === "false") {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      message: "Users fetched successfully.",
      data: { users: users as UserProfile[], total },
    };
  });
}

// ── getUserById ────────────────────────────────────────────

/**
 * Fetches a single user by ID (no password hash).
 * Requires SUPER_ADMIN or ADMIN.
 */
export async function getUserById(
  id: string,
): Promise<ActionState<UserProfile>> {
  return withActionError(async () => {
    await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    return {
      success: true,
      message: "User fetched.",
      data: user as UserProfile,
    };
  });
}

// ── createUser ─────────────────────────────────────────────

/**
 * Creates a new user account.
 *
 * Flow:
 *  1. RBAC check (SUPER_ADMIN or ADMIN).
 *  2. Zod validation.
 *  3. Uniqueness checks (email, employeeCode).
 *  4. Privilege-escalation check: ADMIN cannot create SUPER_ADMIN.
 *  5. `auth.api.signUpEmail` — hashes password, creates User + Account.
 *  6. Prisma update — sets role, isActive, employeeCode, phone, etc.
 *  7. Audit log: USER_CREATED.
 */
export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const actor = await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      role: formData.get("role"),
      isActive: formData.get("isActive") === "true",
      employeeCode: formData.get("employeeCode") || undefined,
      phone: formData.get("phone") || undefined,
      designation: formData.get("designation") || undefined,
      department: formData.get("department") || undefined,
    };

    const parsed = createUserSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const {
      name,
      email,
      password,
      role,
      isActive,
      employeeCode,
      phone,
      designation,
      department,
    } = parsed.data;

    // Privilege escalation check
    if (!canManageRole(actor.role, role as UserRole)) {
      return {
        success: false,
        message: "You do not have permission to assign this role.",
      };
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: { email: ["A user with this email already exists."] },
      };
    }

    // Check employeeCode uniqueness
    if (employeeCode) {
      const existingCode = await prisma.user.findUnique({
        where: { employeeCode },
        select: { id: true },
      });
      if (existingCode) {
        return {
          success: false,
          message: "Please fix the errors below.",
          errors: { employeeCode: ["This employee code is already in use."] },
        };
      }
    }

    // Hash password with Better Auth's standard algorithm (scrypt)
    const hashedPassword = await hashPassword(password);

    // Create user and Better Auth credential account in a single transaction.
    // We create directly via Prisma so session cookies are NOT set for the new user,
    // keeping the active Admin logged in seamlessly.
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as UserRole,
          isActive,
          employeeCode: employeeCode ?? null,
          phone: phone ?? null,
          designation: designation ?? null,
          department: department ?? null,
          emailVerified: true,
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          accountId: createdUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });

      return createdUser;
    });

    await logAuditEvent("USER_CREATED", actor.id, {
      targetUserId: newUser.id,
      email,
      role,
      isActive,
    });

    revalidatePath("/dashboard/users-roles");
    return { success: true, message: `User ${name} created successfully.` };
  });
}

// ── updateUser ─────────────────────────────────────────────

/**
 * Updates a user's profile fields.
 * Email changes are made safely — role is checked for privilege escalation.
 * Password is never touched here.
 */
export async function updateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const actor = await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const raw = {
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      isActive: formData.get("isActive") === "true",
      employeeCode: formData.get("employeeCode") || undefined,
      phone: formData.get("phone") || undefined,
      designation: formData.get("designation") || undefined,
      department: formData.get("department") || undefined,
      image: formData.get("image") || undefined,
    };

    const parsed = updateUserSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const {
      id,
      name,
      email,
      role,
      isActive,
      employeeCode,
      phone,
      designation,
      department,
      image,
    } = parsed.data;

    // Load existing user
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeCode: true,
      },
    });
    if (!existing) {
      return { success: false, message: "User not found." };
    }

    // Privilege escalation check for new role
    if (!canManageRole(actor.role, role as UserRole)) {
      return {
        success: false,
        message: "You do not have permission to assign this role.",
      };
    }

    // Cannot edit users with higher privilege
    if (!canManageRole(actor.role, existing.role as UserRole)) {
      return {
        success: false,
        message: "You do not have permission to edit this user.",
      };
    }

    // Email uniqueness check (if changing)
    if (email !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailConflict && emailConflict.id !== id) {
        return {
          success: false,
          message: "Please fix the errors below.",
          errors: { email: ["A user with this email already exists."] },
        };
      }
    }

    // Employee code uniqueness check (if changing)
    if (employeeCode && employeeCode !== existing.employeeCode) {
      const codeConflict = await prisma.user.findUnique({
        where: { employeeCode },
        select: { id: true },
      });
      if (codeConflict && codeConflict.id !== id) {
        return {
          success: false,
          message: "Please fix the errors below.",
          errors: {
            employeeCode: ["This employee code is already in use."],
          },
        };
      }
    }

    const oldRole = existing.role;
    const oldIsActive = existing.isActive;

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role: role as UserRole,
        isActive,
        employeeCode: employeeCode ?? null,
        phone: phone ?? null,
        designation: designation ?? null,
        department: department ?? null,
        image: image ?? null,
      },
    });

    await logAuditEvent("USER_UPDATED", actor.id, {
      targetUserId: id,
      changes: {
        role: role !== oldRole ? { from: oldRole, to: role } : undefined,
        isActive:
          isActive !== oldIsActive
            ? { from: oldIsActive, to: isActive }
            : undefined,
      },
    });

    revalidatePath("/dashboard/users-roles");
    revalidatePath(`/dashboard/users-roles/${id}`);
    return { success: true, message: "User updated successfully." };
  });
}

// ── changeUserRole ─────────────────────────────────────────

/**
 * Changes a user's role.
 * ADMIN cannot promote to SUPER_ADMIN.
 * Cannot modify users above your own level.
 */
export async function changeUserRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const actor = await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const raw = {
      userId: formData.get("userId"),
      newRole: formData.get("newRole"),
    };

    const parsed = changeRoleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { userId, newRole } = parsed.data;

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });
    if (!target) {
      return { success: false, message: "User not found." };
    }

    if (!canManageRole(actor.role, target.role as UserRole)) {
      return {
        success: false,
        message: "You do not have permission to change this user's role.",
      };
    }

    if (!canManageRole(actor.role, newRole as UserRole)) {
      return {
        success: false,
        message: "You do not have permission to assign this role.",
      };
    }

    const oldRole = target.role;

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as UserRole },
    });

    await logAuditEvent("USER_ROLE_CHANGED", actor.id, {
      targetUserId: userId,
      oldRole,
      newRole,
    });

    revalidatePath("/dashboard/users-roles");
    revalidatePath(`/dashboard/users-roles/${userId}`);
    return {
      success: true,
      message: `${target.name}'s role changed to ${newRole}.`,
    };
  });
}

// ── activateUser ───────────────────────────────────────────

export async function activateUser(userId: string): Promise<ActionState> {
  return withActionError(async () => {
    const actor = await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!target) return { success: false, message: "User not found." };
    if (!canManageRole(actor.role, target.role as UserRole)) {
      return { success: false, message: "Insufficient permissions." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    await logAuditEvent("USER_ACTIVATED", actor.id, { targetUserId: userId });

    revalidatePath("/dashboard/users-roles");
    revalidatePath(`/dashboard/users-roles/${userId}`);
    return { success: true, message: `${target.name} has been activated.` };
  });
}

// ── deactivateUser ─────────────────────────────────────────

export async function deactivateUser(userId: string): Promise<ActionState> {
  return withActionError(async () => {
    const actor = await assertAnyRole(["SUPER_ADMIN", "ADMIN"]);

    // Cannot deactivate yourself
    if (userId === actor.id) {
      return {
        success: false,
        message: "You cannot deactivate your own account.",
      };
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!target) return { success: false, message: "User not found." };
    if (!canManageRole(actor.role, target.role as UserRole)) {
      return { success: false, message: "Insufficient permissions." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await logAuditEvent("USER_DEACTIVATED", actor.id, {
      targetUserId: userId,
    });

    revalidatePath("/dashboard/users-roles");
    revalidatePath(`/dashboard/users-roles/${userId}`);
    return {
      success: true,
      message: `${target.name} has been deactivated.`,
    };
  });
}
