// ============================================================
// prisma/seed.ts
// Clears ALL data, then seeds:
//   • Role permissions
//   • Super Admin user only
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";
import { seedPermissions } from "./seed-permissions";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ── Super Admin credentials ────────────────────────────────
const SUPER_ADMIN = {
  name: "Super Admin",
  email: "cdnfiresuperadmin@gmail.com",
  password: "CdnFire@SuperAdmin#2026!",
  role: "SUPER_ADMIN" as const,
};

// ── Tables to truncate (leaf → root order to respect FK constraints) ─
// Using raw SQL TRUNCATE … CASCADE which handles FK order automatically.
async function clearDatabase() {
  console.log("🗑️   Clearing all data...");

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      customer_refill_replacement,
      customer_refill,
      delivery_note_item,
      delivery_note,
      fire_extinguisher_assignment,
      fire_extinguisher_unit,
      project_estimate_material,
      project_transfer_item,
      project_transfer,
      project_staff,
      labour_ot,
      project_labour,
      tool_history,
      tool_assignment_item,
      tool_assignment,
      tool,
      material_return_item,
      material_return,
      project_material,
      material_issue_item,
      material_issue,
      material_request_item,
      material_request,
      project_engineer,
      project_assignment,
      project_expense,
      project_transport,
      project,
      customer,
      pipe_cut_piece,
      stock_movement,
      stock_batch,
      stock_receive_item,
      stock_receive,
      inventory,
      sub_category,
      category,
      supplier,
      audit_log,
      verification,
      "session",
      account,
      "user"
    RESTART IDENTITY CASCADE
  `);

  console.log("  ✅ All tables cleared.\n");
}

async function main() {
  console.log("\n🌱  Starting database seed...\n");

  // 1. Wipe everything
  await clearDatabase();

  // 2. Re-seed permissions (role_permission & permission tables are
  //    NOT in the truncate list above so they survive — but seedPermissions
  //    uses upsert so it's idempotent either way)
  await seedPermissions(prisma);

  // 3. Create Super Admin
  const hashedPassword = await hashPassword(SUPER_ADMIN.password);

  const user = await prisma.user.create({
    data: {
      name: SUPER_ADMIN.name,
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      role: SUPER_ADMIN.role,
      emailVerified: true,
      isActive: true,
    },
    select: { id: true },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log(`  ✅ Super Admin created.`);
  console.log(`     Email   : ${SUPER_ADMIN.email}`);
  console.log(`     Password: ${SUPER_ADMIN.password}\n`);

  console.log("✨  Seed complete.\n");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
