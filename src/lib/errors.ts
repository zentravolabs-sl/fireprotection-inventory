// ============================================================
// src/lib/errors.ts
// Centralized error handling utilities for the auth module.
// ============================================================

import type { ActionState } from "@/types/auth";

/**
 * Application-specific error class with an optional HTTP status code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Converts an unknown caught value into a human-readable error message.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
}

/**
 * Wraps a server action in a try/catch and returns a typed `ActionState`.
 * Use this to avoid repetitive try/catch boilerplate in every action.
 */
export async function withActionError<T>(
  fn: () => Promise<ActionState<T>>,
): Promise<ActionState<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error("[Server Action Error]", err);
    return {
      success: false,
      message: toErrorMessage(err),
    };
  }
}

/**
 * Maps Better Auth API error codes to user-friendly messages.
 */
export function mapAuthError(error: unknown): string {
  const message = toErrorMessage(error).toLowerCase();

  if (message.includes("invalid email or password") || message.includes("invalid credentials")) {
    return "Invalid email or password. Please check your credentials.";
  }
  if (message.includes("email already in use") || message.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (message.includes("user not found")) {
    return "No account found with that email address.";
  }
  if (message.includes("token") && message.includes("expired")) {
    return "Your reset link has expired. Please request a new one.";
  }
  if (message.includes("invalid token")) {
    return "Invalid or expired reset token. Please request a new one.";
  }
  if (message.includes("password")) {
    return "Incorrect current password.";
  }

  return toErrorMessage(error);
}
