// ============================================================
// src/lib/auth.ts
// Better Auth v1.6.25 server-side configuration.
//
// This is the single source of truth for all authentication
// logic. Import `auth` here into API routes, server actions,
// middleware, and server components.
// ============================================================

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  plugins: [nextCookies()],

  // ── Database ───────────────────────────────────────────────
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ── Email & Password ───────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    // Email verification is disabled for internal system.
    // Enable and configure an email sender when going to production.
    requireEmailVerification: false,
    // Minimum password length (Zod enforces stronger rules on the client).
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // ── Session ────────────────────────────────────────────────
  session: {
    // Default session expiry: 7 days (in seconds)
    expiresIn: 60 * 60 * 24 * 7,
    // Rolling sessions: refresh expiry on each request
    updateAge: 60 * 60 * 24, // Refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session for 5 minutes to reduce DB reads
    },
  },

  // ── User fields ────────────────────────────────────────────
  // Extend the Better Auth user model with our custom fields.
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // Prevent clients from setting role directly
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      employeeCode: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      designation: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      department: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },

  // ── Cookie Configuration ───────────────────────────────────
  advanced: {
    cookiePrefix: "cdnfire",
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },

  // ── Secret ────────────────────────────────────────────────
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

// Export the inferred types for use throughout the application
export type Auth = typeof auth;
