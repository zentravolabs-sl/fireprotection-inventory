// ============================================================
// prisma/seed-project.ts
// Seeds ONE sample project:
//   • 1 Customer
//   • 1 Project Manager user
//   • 1 Project record
//
// Run: npx tsx prisma/seed-project.ts
// Does NOT wipe existing data.
// ============================================================

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient(
  { adapter } as ConstructorParameters<typeof PrismaClient>[0]
);

async function main() {
  console.log("\n🌱  Seeding sample project...\n");

  // ── 1. Customer ────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { companyName: "Al Futtaim Engineering LLC" },
    update: {},
    create: {
      companyName: "Al Futtaim Engineering LLC",
      contactPerson: "Mohammed Al Rashid",
      phone: "+971-50-123-4567",
      email: "projects@alfuttaim-eng.ae",
      address: "Business Bay, Dubai, UAE",
    },
  });
  console.log(`  ✅ Customer : ${customer.companyName} (id=${customer.id})`);

  // ── 2. Project Manager user ────────────────────────────────
  const pmEmail = "pm.demo@cdnfire.ae";
  const pmPassword = "CdnFire@PM#2026!";
  const hashedPassword = await hashPassword(pmPassword);

  const pmUser = await prisma.user.upsert({
    where: { email: pmEmail },
    update: {},
    create: {
      name: "Ahmed Khalid",
      email: pmEmail,
      password: hashedPassword,
      role: "PROJECT_MANAGER",
      emailVerified: true,
      isActive: true,
      employeeCode: "EMP-PM-001",
      phone: "+971-55-987-6543",
      designation: "Senior Project Manager",
      department: "Projects",
    },
  });

  // Create credential account for the PM (if it doesn't exist)
  const existingAccount = await prisma.account.findFirst({
    where: { userId: pmUser.id, providerId: "credential" },
  });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: pmUser.id,
        accountId: pmUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
  }

  console.log(`  ✅ Project Manager: ${pmUser.name} <${pmUser.email}>`);
  console.log(`     Password: ${pmPassword}`);

  // ── 3. Project ─────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { projectCode: "PRJ-2026-001" },
    update: {},
    create: {
      projectCode: "PRJ-2026-001",
      projectName: "Al Futtaim HQ Fire Suppression System",
      customerId: customer.id,
      projectManagerId: pmUser.id,
      location: "Business Bay Tower, Dubai, UAE",
      startDate: new Date("2026-09-15"),
      endDate: new Date("2027-03-31"),
      status: "IN_PROGRESS",
      projectType: "PRIVATE",
      description:
        "Design, supply, and installation of a complete fire suppression and detection system for the Al Futtaim HQ tower, covering 28 floors including server rooms and parking levels.",
      projectValue: 2_850_000,
      estimatedMaterialCost: 1_200_000,
      estimatedLabourCost: 480_000,
      estimatedTransportCost: 95_000,
      estimatedEquipmentCost: 220_000,
      estimatedOtherCost: 55_000,
      estimatedTotalCost: 2_050_000,
    },
  });

  console.log(`\n  ✅ Project created:`);
  console.log(`     Code      : ${project.projectCode}`);
  console.log(`     Name      : ${project.projectName}`);
  console.log(`     Status    : ${project.status}`);
  console.log(`     Value     : AED ${project.projectValue.toLocaleString()}`);
  console.log(`     Est. Cost : AED ${project.estimatedTotalCost.toLocaleString()}`);

  // ── 4. Project Assignment (log PM formally) ────────────────
  const existingAssignment = await prisma.projectAssignment.findFirst({
    where: { projectId: project.id, projectManagerId: pmUser.id },
  });
  if (!existingAssignment) {
    // We need a "assignedBy" — reuse the PM themselves or find super admin
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });
    const assignedById = superAdmin?.id ?? pmUser.id;

    await prisma.projectAssignment.create({
      data: {
        projectId: project.id,
        projectManagerId: pmUser.id,
        assignedBy: assignedById,
      },
    });
    console.log(`  ✅ ProjectAssignment logged.`);
  }

  console.log("\n✨  Sample project seed complete.\n");
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
