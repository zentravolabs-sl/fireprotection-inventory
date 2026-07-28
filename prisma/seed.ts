// ============================================================
// prisma/seed.ts
// Database seed script — idempotent upsert behaviour.
//
// Run: npx prisma db seed
//
// Seeded accounts:
//   superadmin@example.com / SuperAdmin@123  → SUPER_ADMIN
//   admin1@example.com     / Admin@123       → ADMIN
//   admin2@example.com     / Admin@123       → ADMIN
//   user1–5@example.com    / User@123        → USER
//
// Passwords are hashed using Better Auth's built-in hasher
// so they are compatible with `auth.api.signInEmail`.
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Import Better Auth's password hashing utility
// This ensures seeds are compatible with Better Auth sign-in
import { hashPassword } from "better-auth/crypto";

// ── Prisma singleton for seed ──────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ── Seed definitions ───────────────────────────────────────

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
};

const adminUsers: SeedUser[] = [
  { name: "Super Admin",  email: "superadmin@example.com", password: "SuperAdmin@123", role: "SUPER_ADMIN" },
  { name: "Admin 1",      email: "admin1@example.com",     password: "Admin@123",      role: "ADMIN"       },
  { name: "Admin 2",      email: "admin2@example.com",     password: "Admin@123",      role: "ADMIN"       },
];

const demoUsers: SeedUser[] = Array.from({ length: 5 }, (_, i) => ({
  name:     `Demo User ${i + 1}`,
  email:    `user${i + 1}@example.com`,
  password: "User@123",
  role:     "USER" as const,
}));

const allUsers: SeedUser[] = [...adminUsers, ...demoUsers];

// ── Main seed function ─────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting database seed...\n");

  let created = 0;
  let skipped = 0;

  for (const seed of allUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: seed.email },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⏭  Skipped  ${seed.email}  (already exists)`);
      skipped++;
      continue;
    }

    // Hash password using Better Auth's hasher (bcrypt-compatible)
    const hashedPassword = await hashPassword(seed.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name:          seed.name,
        email:         seed.email,
        password:      hashedPassword,
        role:          seed.role,
        emailVerified: true,
        isActive:      true,
      },
    });

    // Create the linked credential account (required for email/password sign-in)
    await prisma.account.create({
      data: {
        userId:     user.id,
        accountId:  user.id,
        providerId: "credential",
        password:   hashedPassword,
      },
    });

    // Write initial audit log entry
    await prisma.auditLog.create({
      data: {
        action:   "USER_SEEDED",
        userId:   user.id,
        metadata: { email: user.email, role: user.role, seededAt: new Date().toISOString() },
      },
    });

    console.log(`  ✅  Created  ${seed.email}  [${seed.role}]`);
    created++;
  }

  console.log(`\n✨  Seed complete — ${created} created, ${skipped} skipped.\n`);
}

// ── Execute ────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
