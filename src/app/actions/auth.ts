"use server";

// ============================================================
// src/app/actions/auth.ts
// Server Actions for all authentication operations.
//
// All actions return `ActionState<T>` for `useActionState`
// compatibility. Zod validates inputs before any DB/auth call.
// Audit events are written to the AuditLog table.
// ============================================================

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapAuthError, withActionError } from "@/lib/errors";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";
import type { ActionState } from "@/types/auth";

// ── Helpers ────────────────────────────────────────────────

/**
 * Write an immutable entry to the AuditLog table.
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
        // Cast to Prisma.InputJsonValue to satisfy the typed JSON field
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    // Non-fatal: log to console but don't break the calling action
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}

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

// ── loginAction ────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const raw = {
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on",
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { email, password } = parsed.data;

    let response;
    try {
      response = await auth.api.signInEmail({
        body: { email, password },
        headers: await headers(),
      });
    } catch (err) {
      return { success: false, message: mapAuthError(err) };
    }

    if (!response?.user) {
      return { success: false, message: "Invalid email or password." };
    }

    await logAuditEvent("USER_LOGIN", response.user.id, {
      email,
      ip: (await headers()).get("x-forwarded-for") ?? "unknown",
    });

    return { success: true, message: "Welcome back!" };
  });
}

// ── registerAction ─────────────────────────────────────────

/**
 * Creates a new user account with USER role.
 */
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { name, email, password } = parsed.data;

    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    if (!response?.user) {
      return { success: false, message: "Registration failed. Please try again." };
    }

    await logAuditEvent("USER_REGISTER", response.user.id, { email, name });

    return {
      success: true,
      message: "Account created successfully! You can now sign in.",
    };
  });
}

// ── logoutAction ───────────────────────────────────────────

/**
 * Terminates the current session and clears the session cookie.
 * Returns void (compatible with form action prop).
 */
export async function logoutAction(): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await auth.api.signOut({
      headers: await headers(),
    });

    if (session?.user?.id) {
      await logAuditEvent("USER_LOGOUT", session.user.id);
    }
  } catch (err) {
    console.error("[logoutAction]", err);
  }

  redirect("/login");
}

// ── forgotPasswordAction ───────────────────────────────────

/**
 * Initiates a password reset flow.
 * Uses auth.api.requestPasswordReset (Better Auth v1.6.x).
 */
export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const raw = { email: formData.get("email") };

    const parsed = forgotPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please enter a valid email address.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { email } = parsed.data;

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/reset-password`,
      },
      headers: await headers(),
    });

    // Audit log (user may not exist — that's fine, prevents enumeration)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    await logAuditEvent("PASSWORD_RESET_REQUESTED", user?.id ?? null, { email });

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };
  });
}

// ── resetPasswordAction ────────────────────────────────────

/**
 * Verifies the reset token and sets a new password.
 */
export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const raw = {
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const parsed = resetPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { token, password } = parsed.data;

    try {
      await auth.api.resetPassword({
        body: { token, newPassword: password },
        headers: await headers(),
      });
    } catch (err) {
      return { success: false, message: mapAuthError(err) };
    }

    await logAuditEvent("PASSWORD_RESET_COMPLETED", null, {});

    return {
      success: true,
      message: "Your password has been reset. You can now sign in.",
    };
  });
}

// ── changePasswordAction ───────────────────────────────────

/**
 * Changes the password for the currently authenticated user.
 */
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withActionError(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, message: "You must be signed in to change your password." };
    }

    const raw = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmNewPassword: formData.get("confirmNewPassword"),
    };

    const parsed = changePasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors below.",
        errors: extractZodErrors(parsed.error),
      };
    }

    const { currentPassword, newPassword } = parsed.data;

    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch (err) {
      return { success: false, message: mapAuthError(err) };
    }

    await logAuditEvent("PASSWORD_CHANGED", session.user.id, {
      revokedOtherSessions: true,
    });

    return {
      success: true,
      message: "Password changed successfully. Other sessions have been signed out.",
    };
  });
}
