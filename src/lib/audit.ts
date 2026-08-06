// ============================================================
// src/lib/audit.ts
// Shared audit log helper.
//
// Extracted from src/app/actions/auth.ts so that any server
// action can write audit events without circular imports.
// ============================================================

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Write an immutable entry to the AuditLog table.
 * Non-fatal: logs to console on failure but does not throw.
 */
export async function logAuditEvent(
  action: string,
  userId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}
