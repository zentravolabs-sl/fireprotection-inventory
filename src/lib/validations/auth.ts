// ============================================================
// src/lib/validations/auth.ts
// Zod v4 validation schemas for all authentication forms.
// Note: Zod v4 uses `error` instead of `required_error`.
// ============================================================

import { z } from "zod";

// ── Shared field rules ──────────────────────────────────────

const emailField = z
  .string()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be no more than 128 characters.");

const strongPasswordField = passwordField
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

// ── Login Schema ────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
  // Use optional() so RHF resolver types align (boolean | undefined → coerced to boolean)
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Register Schema ─────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name must be no more than 100 characters.")
      .trim(),
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Forgot Password Schema ──────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password Schema ───────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing."),
    password: strongPasswordField,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ── Change Password Schema ──────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: strongPasswordField,
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
