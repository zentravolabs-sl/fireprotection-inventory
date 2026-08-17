// ============================================================
// src/lib/prisma.ts
// Prisma Client singleton using the Neon serverless driver.
//
// Why @neondatabase/serverless instead of pg?
//   Neon computes sleep after ~5 min of inactivity. The pg driver
//   keeps persistent TCP connections that Neon kills server-side,
//   causing ETIMEDOUT errors on the next request. The Neon
//   serverless driver uses HTTP for individual queries and
//   WebSockets only for transactions — no persistent connection
//   to go stale.
// ============================================================

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: parseInt(process.env.PG_MAX_POOL || "5", 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || "15000", 10),
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Force fresh instance in development when schema updates
export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
