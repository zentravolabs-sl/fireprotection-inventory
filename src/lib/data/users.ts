// ============================================================
// src/lib/data/users.ts
// Data Access Layer for User queries.
//
// These are plain async server-side functions — NOT Server Actions.
// They are called directly from Server Components (no "use server"
// boundary, no POST context, so cookies/session work correctly).
//
// Authentication is enforced by the calling page via requireAnyRole.
// These functions only do data-fetching (Prisma reads).
// ============================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { UserProfile, UserRole } from "@/types/auth";

// ── Select set (no password hash, no sensitive fields) ──────

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

// ── Filters ─────────────────────────────────────────────────

export interface GetUsersFilters {
  search?: string;
  role?: UserRole | "";
  isActive?: "true" | "false" | "";
}

export interface GetUsersResult {
  users: UserProfile[];
  total: number;
}

// ── queryUsers ───────────────────────────────────────────────

/**
 * Fetches users with optional filters.
 * Called directly from Server Components after auth gate.
 */
export async function queryUsers(
  filters: GetUsersFilters = {},
): Promise<GetUsersResult> {
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

  return { users: users as UserProfile[], total };
}

// ── queryUserById ────────────────────────────────────────────

/**
 * Fetches a single user by ID.
 * Returns null if not found.
 * Called directly from Server Components after auth gate.
 */
export async function queryUserById(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SAFE_SELECT,
  });

  return user ? (user as UserProfile) : null;
}
