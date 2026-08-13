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

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

// In Node.js (non-edge) environments we need ws for WebSocket support
// (required for interactive transactions). In Edge runtimes the native
// WebSocket is available globally.
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // In Prisma v7, PrismaNeon accepts a PoolConfig (not a Pool instance)
  // and manages the connection pool internally.
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
    // Keep pool small — Neon free tier has a connection limit.
    // Each serverless invocation creates a short-lived connection.
    max: parseInt(process.env.PG_MAX_POOL || "3", 10),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Bust the cached singleton in development if new schema models/enums were added
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
