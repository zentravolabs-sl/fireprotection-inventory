// ============================================================
// src/types/auth.ts
// Shared TypeScript types for the authentication module.
// ============================================================

/**
 * Role enumeration matching the Prisma schema Role enum.
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

/**
 * Typed response shape returned by all Server Actions.
 * Compatible with React's `useActionState` hook.
 *
 * @template T - The type of the returned data on success.
 */
export type ActionState<T = undefined> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

/**
 * The safe user object exposed from session data.
 * Matches fields returned by Better Auth session.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The full session object from Better Auth.
 */
export interface AppSession {
  user: SessionUser;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}
