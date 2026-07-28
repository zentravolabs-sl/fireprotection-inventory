// ============================================================
// src/lib/auth-client.ts
// Better Auth browser/client-side instance.
//
// Import from this file in Client Components ("use client").
// Do NOT import `auth` (server) from here.
// ============================================================

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

// Named exports for ergonomic usage in components
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
