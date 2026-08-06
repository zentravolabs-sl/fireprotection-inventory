import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL database...");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ToolAssignmentStatus') THEN
          CREATE TYPE "ToolAssignmentStatus" AS ENUM ('ACTIVE', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED');
        END IF;
      END $$;
    `);
    console.log("Enum ToolAssignmentStatus created/verified.");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ToolHistoryAction') THEN
          CREATE TYPE "ToolHistoryAction" AS ENUM ('ASSIGNED', 'RETURNED', 'REPAIR', 'LOST', 'RETIRED');
        END IF;
      END $$;
    `);
    console.log("Enum ToolHistoryAction created/verified.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "tool_assignment" (
          "id" SERIAL NOT NULL,
          "assignmentNo" TEXT NOT NULL,
          "projectId" INTEGER NOT NULL,
          "engineerId" TEXT NOT NULL,
          "assignDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expectedReturnDate" TIMESTAMP(3),
          "remarks" TEXT,
          "status" "ToolAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "tool_assignment_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Table tool_assignment created/verified.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "tool_assignment_item" (
          "id" SERIAL NOT NULL,
          "toolAssignmentId" INTEGER NOT NULL,
          "toolId" INTEGER NOT NULL,
          "conditionAtIssue" "ToolCondition" NOT NULL,
          "returnedAt" TIMESTAMP(3),
          "returnCondition" "ToolCondition",
          "remarks" TEXT,

          CONSTRAINT "tool_assignment_item_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Table tool_assignment_item created/verified.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "tool_history" (
          "id" SERIAL NOT NULL,
          "toolId" INTEGER NOT NULL,
          "projectId" INTEGER,
          "engineerId" TEXT,
          "action" "ToolHistoryAction" NOT NULL,
          "remarks" TEXT,
          "createdBy" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "tool_history_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Table tool_history created/verified.");

    // Indexes
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tool_assignment_assignmentNo_key" ON "tool_assignment"("assignmentNo");
      CREATE INDEX IF NOT EXISTS "tool_assignment_projectId_idx" ON "tool_assignment"("projectId");
      CREATE INDEX IF NOT EXISTS "tool_assignment_engineerId_idx" ON "tool_assignment"("engineerId");
      CREATE INDEX IF NOT EXISTS "tool_assignment_status_idx" ON "tool_assignment"("status");
      CREATE INDEX IF NOT EXISTS "tool_assignment_assignDate_idx" ON "tool_assignment"("assignDate");

      CREATE INDEX IF NOT EXISTS "tool_assignment_item_toolAssignmentId_idx" ON "tool_assignment_item"("toolAssignmentId");
      CREATE INDEX IF NOT EXISTS "tool_assignment_item_toolId_idx" ON "tool_assignment_item"("toolId");

      CREATE INDEX IF NOT EXISTS "tool_history_toolId_idx" ON "tool_history"("toolId");
      CREATE INDEX IF NOT EXISTS "tool_history_projectId_idx" ON "tool_history"("projectId");
      CREATE INDEX IF NOT EXISTS "tool_history_engineerId_idx" ON "tool_history"("engineerId");
      CREATE INDEX IF NOT EXISTS "tool_history_action_idx" ON "tool_history"("action");
      CREATE INDEX IF NOT EXISTS "tool_history_createdAt_idx" ON "tool_history"("createdAt");
    `);
    console.log("Indexes created/verified.");

    // Foreign Keys
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_assignment_projectId_fkey') THEN
          ALTER TABLE "tool_assignment" ADD CONSTRAINT "tool_assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_assignment_engineerId_fkey') THEN
          ALTER TABLE "tool_assignment" ADD CONSTRAINT "tool_assignment_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_assignment_item_toolAssignmentId_fkey') THEN
          ALTER TABLE "tool_assignment_item" ADD CONSTRAINT "tool_assignment_item_toolAssignmentId_fkey" FOREIGN KEY ("toolAssignmentId") REFERENCES "tool_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_assignment_item_toolId_fkey') THEN
          ALTER TABLE "tool_assignment_item" ADD CONSTRAINT "tool_assignment_item_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_history_toolId_fkey') THEN
          ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_history_projectId_fkey') THEN
          ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tool_history_createdBy_fkey') THEN
          ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log("Foreign keys created/verified.");

    console.log("SUCCESS: All Tool Assignment tables, enums, indexes, and constraints applied to PostgreSQL database!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration Error:", err);
  process.exit(1);
});
