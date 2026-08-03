// ============================================================
// prisma/seed.ts
// Database seed script — idempotent upsert behaviour.
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

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

async function main() {
  console.log("\n🌱  Starting database seed...\n");

  let createdUsers = 0;
  let superAdminId = "";

  for (const seed of allUsers) {
    let user = await prisma.user.findUnique({
      where: { email: seed.email },
      select: { id: true, role: true },
    });

    if (!user) {
      const hashedPassword = await hashPassword(seed.password);
      user = await prisma.user.create({
        data: {
          name:          seed.name,
          email:         seed.email,
          password:      hashedPassword,
          role:          seed.role,
          emailVerified: true,
          isActive:      true,
        },
        select: { id: true, role: true },
      });

      await prisma.account.create({
        data: {
          userId:     user.id,
          accountId:  user.id,
          providerId: "credential",
          password:   hashedPassword,
        },
      });

      await prisma.auditLog.create({
        data: {
          action:   "USER_SEEDED",
          userId:   user.id,
          metadata: { email: seed.email, role: seed.role, seededAt: new Date().toISOString() },
        },
      });
      createdUsers++;
    }

    if (seed.role === "SUPER_ADMIN") {
      superAdminId = user.id;
    }
  }
  console.log(`  ✅ Users seeded (${createdUsers} new).`);

  // ── Seed Categories & SubCategories ─────────────────────────
  const catPipes = await prisma.category.upsert({
    where: { categoryName: "Pipes & Fittings" },
    update: {},
    create: { categoryName: "Pipes & Fittings" },
  });

  const catSprinklers = await prisma.category.upsert({
    where: { categoryName: "Sprinkler Heads" },
    update: {},
    create: { categoryName: "Sprinkler Heads" },
  });

  const subSeamless = await prisma.subCategory.upsert({
    where: { categoryId_name: { categoryId: catPipes.id, name: "Seamless Steel Pipes" } },
    update: {},
    create: { categoryId: catPipes.id, name: "Seamless Steel Pipes" },
  });

  const subPendent = await prisma.subCategory.upsert({
    where: { categoryId_name: { categoryId: catSprinklers.id, name: "Pendent Sprinklers" } },
    update: {},
    create: { categoryId: catSprinklers.id, name: "Pendent Sprinklers" },
  });

  console.log("  ✅ Categories & SubCategories seeded.");

  // ── Seed Suppliers ──────────────────────────────────────────
  const supplier1 = await prisma.supplier.upsert({
    where: { company: "Apex Fire Piping Ltd" },
    update: {},
    create: {
      company: "Apex Fire Piping Ltd",
      contactPerson: "David Miller",
      phone: "+1 555-0192",
      email: "sales@apexfirere.com",
      address: "100 Industrial Way, Suite 400",
    },
  });

  console.log("  ✅ Suppliers seeded.");

  // ── Seed Inventory Master Items ─────────────────────────────
  const pipeItem = await prisma.inventory.upsert({
    where: { itemCode: "PIPE-GALV-001" },
    update: {},
    create: {
      itemCode: "PIPE-GALV-001",
      name: "2-Inch Galvanized Schedule 40 Pipe (6M)",
      brand: "Victaulic",
      unit: "Mtr",
      minStock: 50,
      barcode: "890123456701",
      rackLocation: "Rack A-1",
      warehouse: "Main Warehouse",
      defaultSellPrice: 45.0,
      categoryId: catPipes.id,
      subCategoryId: subSeamless.id,
    },
  });

  const sprinklerItem = await prisma.inventory.upsert({
    where: { itemCode: "SPR-PEND-68C" },
    update: {},
    create: {
      itemCode: "SPR-PEND-68C",
      name: "Standard Response Pendent Sprinkler 68°C (K-5.6)",
      brand: "Tyco",
      unit: "Pcs",
      minStock: 200,
      barcode: "890123456702",
      rackLocation: "Bin B-12",
      warehouse: "Main Warehouse",
      defaultSellPrice: 12.5,
      categoryId: catSprinklers.id,
      subCategoryId: subPendent.id,
    },
  });

  console.log("  ✅ Inventory Master items seeded.");

  // ── Seed Confirmed Stock Receive with Batches & Movements ────
  const existingReceive = await prisma.stockReceive.findUnique({
    where: { receiveNo: "GRN-20260801-001" },
  });

  if (!existingReceive && superAdminId) {
    const receiveDate = new Date();
    await prisma.$transaction(async (tx) => {
      const rec = await tx.stockReceive.create({
        data: {
          receiveNo: "GRN-20260801-001",
          supplierId: supplier1.id,
          receiveDate,
          referenceNo: "PO-2026-901",
          remarks: "Initial stock delivery seed",
          status: "CONFIRMED",
          receivedBy: superAdminId,
          items: {
            create: [
              {
                inventoryId: pipeItem.id,
                qty: 120,
                unitCost: 32.0,
                batchNo: "BATCH-PIPE-001",
              },
              {
                inventoryId: sprinklerItem.id,
                qty: 500,
                unitCost: 8.5,
                batchNo: "BATCH-SPR-001",
              },
            ],
          },
        },
        include: { items: true },
      });

      for (const item of rec.items) {
        const batch = await tx.stockBatch.create({
          data: {
            inventoryId: item.inventoryId,
            stockReceiveItemId: item.id,
            batchNo: item.batchNo,
            receivedQty: item.qty,
            availableQty: item.qty,
            unitCost: item.unitCost,
            receiveDate,
            warehouse: "Main Warehouse",
          },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: item.inventoryId,
            stockBatchId: batch.id,
            qty: item.qty,
            movementType: "IN",
            referenceType: "STOCK_RECEIVE",
            referenceId: rec.id,
            remarks: "Initial Goods Receive Confirmation",
            createdBy: superAdminId,
          },
        });
      }
    });

    console.log("  ✅ Sample Confirmed Stock Receive & Batches seeded.");
  }

  console.log("\n✨  Seed complete.\n");
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
