// ============================================================
// src/lib/services/customerRefillService.ts
// Service Layer — Customer-Owned Fire Extinguisher Refill Management
//
// BUSINESS RULES:
// - Customer-owned extinguishers NEVER affect Inventory, StockBatch, or StockMovement.
// - Temporary replacements ALWAYS come from our warehouse stock.
// - Issuing replacements: StockMovement OUT (CUSTOMER_REFILL_TEMPORARY_REPLACEMENT) + FIFO batch deduction.
// - Returning replacements: StockMovement IN (CUSTOMER_REFILL_TEMPORARY_REPLACEMENT_RETURN) + FIFO batch restore.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { CustomerRefillStatus, ReplacementStatus } from "@/generated/prisma/client";

// ─── Input Interfaces ─────────────────────────────────────────────────────────

export interface CreateCustomerRefillInput {
  customerId: number;
  receivedDate?: string;
  notes?: string | null;
  status?: "DRAFT" | "RECEIVED";
  items: {
    extinguisherType: string;
    capacity?: string | null;
    receivedQty: number;
    notes?: string | null;
  }[];
  hasReplacements?: boolean;
  replacements?: {
    inventoryId: number;
    issuedQty: number;
    notes?: string | null;
  }[];
}

export interface CompleteReturnInput {
  refillId: number;
  returnedItems: { itemId: number; returnQty: number }[];
  returnedReplacements?: { replacementId: number; returnQty: number }[];
  notes?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function generateRefillNo(tx: any): Promise<string> {
  const count = await tx.customerRefill.count();
  let n = count + 1;
  let candidate = `CRF-${String(n).padStart(5, "0")}`;
  while (await tx.customerRefill.findUnique({ where: { refillNo: candidate } })) {
    n++;
    candidate = `CRF-${String(n).padStart(5, "0")}`;
  }
  return candidate;
}

// ─── Create Customer Refill ────────────────────────────────────────────────────

/**
 * Creates a CustomerRefill record and optionally issues temporary replacements
 * from warehouse stock (FIFO) within a single atomic transaction.
 */
export async function createCustomerRefillService(
  input: CreateCustomerRefillInput,
  actorId: string
) {
  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new Error(`Customer #${input.customerId} not found.`);

    const refillNo = await generateRefillNo(tx);
    const receivedDate = input.receivedDate ? new Date(input.receivedDate) : new Date();

    // 1. Create the CustomerRefill header
    const refill = await tx.customerRefill.create({
      data: {
        refillNo,
        customerId: input.customerId,
        receivedDate,
        status: (input.status ?? "RECEIVED") as CustomerRefillStatus,
        notes: input.notes?.trim() || null,
        createdById: actorId,
      },
    });

    // 2. Create CustomerRefillItem rows (NO stock impact — customer-owned)
    for (const item of input.items) {
      await tx.customerRefillItem.create({
        data: {
          customerRefillId: refill.id,
          extinguisherType: item.extinguisherType.trim(),
          capacity: item.capacity?.trim() || null,
          receivedQty: item.receivedQty,
          returnedQty: 0,
          notes: item.notes?.trim() || null,
        },
      });
    }

    // 3. Issue temporary replacements from OUR warehouse (if requested)
    if (input.hasReplacements && input.replacements && input.replacements.length > 0) {
      for (const repl of input.replacements) {
        if (repl.issuedQty <= 0) continue;

        // FIFO batches — oldest first
        const batches = await tx.stockBatch.findMany({
          where: { inventoryId: repl.inventoryId, availableQty: { gt: 0 } },
          orderBy: { receiveDate: "asc" },
        });

        const totalAvailable = batches.reduce((s, b) => s + b.availableQty, 0);
        if (totalAvailable < repl.issuedQty) {
          const inv = await tx.inventory.findUnique({ where: { id: repl.inventoryId } });
          throw new Error(
            `Insufficient stock for '${inv?.name ?? `Item #${repl.inventoryId}`}'. ` +
              `Requested: ${repl.issuedQty}, Available: ${totalAvailable}`
          );
        }

        // Consume FIFO
        let remaining = repl.issuedQty;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(batch.availableQty, remaining);

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { availableQty: { decrement: take } },
          });

          await tx.stockMovement.create({
            data: {
              inventoryId: repl.inventoryId,
              stockBatchId: batch.id,
              qty: take,
              movementType: "OUT",
              referenceType: "CUSTOMER_REFILL_TEMPORARY_REPLACEMENT",
              referenceId: refill.id,
              remarks: `Temp replacement issued for ${refillNo} (${customer.companyName})`,
              createdBy: actorId,
            },
          });

          remaining -= take;
        }

        await tx.customerRefillReplacement.create({
          data: {
            customerRefillId: refill.id,
            inventoryId: repl.inventoryId,
            issuedQty: repl.issuedQty,
            returnedQty: 0,
            status: "ISSUED",
            issuedDate: new Date(),
            notes: repl.notes?.trim() || null,
          },
        });
      }
    }

    return tx.customerRefill.findUniqueOrThrow({
      where: { id: refill.id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
      },
    });
  });
}

// ─── Status Transitions ────────────────────────────────────────────────────────

export async function startRefillService(refillId: number) {
  const refill = await prisma.customerRefill.findUnique({ where: { id: refillId } });
  if (!refill) throw new Error(`Customer Refill #${refillId} not found.`);
  if (refill.status === "COMPLETED") throw new Error("Cannot start a completed refill job.");
  if (refill.status === "CANCELLED") throw new Error("Cannot start a cancelled refill job.");

  return prisma.customerRefill.update({
    where: { id: refillId },
    data: { status: "IN_PROGRESS" },
    include: {
      customer: true,
      items: true,
      replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
    },
  });
}

export async function markRefillReadyService(refillId: number) {
  const refill = await prisma.customerRefill.findUnique({ where: { id: refillId } });
  if (!refill) throw new Error(`Customer Refill #${refillId} not found.`);
  if (refill.status === "COMPLETED") throw new Error("This refill job is already completed.");
  if (refill.status === "CANCELLED") throw new Error("Cannot mark a cancelled refill job as ready.");

  return prisma.customerRefill.update({
    where: { id: refillId },
    data: { status: "READY_TO_RETURN" },
    include: {
      customer: true,
      items: true,
      replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
    },
  });
}

// ─── Complete & Return ────────────────────────────────────────────────────────

export async function completeRefillReturnService(input: CompleteReturnInput, actorId: string) {
  return await prisma.$transaction(async (tx) => {
    const refill = await tx.customerRefill.findUnique({
      where: { id: input.refillId },
      include: {
        customer: true,
        items: true,
        replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
      },
    });

    if (!refill) throw new Error(`Customer Refill #${input.refillId} not found.`);
    if (refill.status === "COMPLETED") throw new Error(`${refill.refillNo} is already COMPLETED.`);
    if (refill.status === "CANCELLED") throw new Error("Cannot process return for a CANCELLED refill.");

    // ── Step 1: Update customer-owned item return quantities (NO stock movement) ──
    for (const r of input.returnedItems) {
      if (r.returnQty <= 0) continue;
      const existing = refill.items.find((i) => i.id === r.itemId);
      if (!existing) continue;

      const newReturnedQty = existing.returnedQty + r.returnQty;
      if (newReturnedQty > existing.receivedQty) {
        throw new Error(
          `Return qty ${newReturnedQty} exceeds received qty ${existing.receivedQty} for '${existing.extinguisherType}'.`
        );
      }
      await tx.customerRefillItem.update({
        where: { id: existing.id },
        data: { returnedQty: newReturnedQty },
      });
    }

    // ── Step 2 & 3: Process temporary replacement returns + StockMovement IN ──
    for (const r of input.returnedReplacements ?? []) {
      if (r.returnQty <= 0) continue;
      const existing = refill.replacements.find((repl) => repl.id === r.replacementId);
      if (!existing) continue;

      const newReturnedQty = existing.returnedQty + r.returnQty;
      if (newReturnedQty > existing.issuedQty) {
        throw new Error(
          `Return qty ${newReturnedQty} exceeds issued qty ${existing.issuedQty} for '${existing.inventory.name}'.`
        );
      }

      const newStatus: ReplacementStatus =
        newReturnedQty >= existing.issuedQty ? "RETURNED" : "PARTIALLY_RETURNED";

      await tx.customerRefillReplacement.update({
        where: { id: existing.id },
        data: {
          returnedQty: newReturnedQty,
          status: newStatus,
          returnedDate: newReturnedQty >= existing.issuedQty ? new Date() : null,
        },
      });

      // Restore stock — add to the most recent batch (last-received)
      const targetBatch = await tx.stockBatch.findFirst({
        where: { inventoryId: existing.inventoryId },
        orderBy: { receiveDate: "desc" },
      });
      if (!targetBatch) {
        throw new Error(
          `No stock batch found to restore inventory #${existing.inventoryId} (${existing.inventory.name}).`
        );
      }

      await tx.stockBatch.update({
        where: { id: targetBatch.id },
        data: { availableQty: { increment: r.returnQty } },
      });

      await tx.stockMovement.create({
        data: {
          inventoryId: existing.inventoryId,
          stockBatchId: targetBatch.id,
          qty: r.returnQty,
          movementType: "IN",
          referenceType: "CUSTOMER_REFILL_TEMPORARY_REPLACEMENT_RETURN",
          referenceId: refill.id,
          remarks: `Temp replacement returned for ${refill.refillNo} (${refill.customer.companyName})`,
          createdBy: actorId,
        },
      });
    }

    // ── Step 4: Check completion ──
    const fresh = await tx.customerRefill.findUniqueOrThrow({
      where: { id: input.refillId },
      include: { items: true, replacements: true },
    });

    const allItemsDone = fresh.items.every((i) => i.returnedQty >= i.receivedQty);
    const allReplsDone = fresh.replacements.every((r) => r.returnedQty >= r.issuedQty);
    const isComplete = allItemsDone && allReplsDone;

    await tx.customerRefill.update({
      where: { id: input.refillId },
      data: {
        status: isComplete ? "COMPLETED" : "READY_TO_RETURN",
        completedDate: isComplete ? new Date() : null,
      },
    });

    return tx.customerRefill.findUniqueOrThrow({
      where: { id: input.refillId },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
      },
    });
  });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCustomerRefillsService(filters?: {
  tab?: "ALL" | "DRAFT" | "RECEIVED" | "IN_PROGRESS" | "READY_TO_RETURN" | "COMPLETED" | "CANCELLED";
  search?: string;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Record<string, any> = {};

  if (filters?.tab && filters.tab !== "ALL") {
    where.status = filters.tab as CustomerRefillStatus;
  }
  if (filters?.customerId) where.customerId = filters.customerId;

  if (filters?.dateFrom || filters?.dateTo) {
    where.receivedDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59.999Z") } : {}),
    };
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { refillNo: { contains: q, mode: "insensitive" } },
      { customer: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return prisma.customerRefill.findMany({
    where,
    include: {
      customer: { select: { id: true, companyName: true, contactPerson: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      items: true,
      replacements: {
        include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerRefillByIdService(id: number) {
  const refill = await prisma.customerRefill.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: true,
      replacements: {
        include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } },
      },
    },
  });

  if (!refill) return null;

  const stockMovements = await prisma.stockMovement.findMany({
    where: {
      referenceId: id,
      referenceType: {
        in: ["CUSTOMER_REFILL_TEMPORARY_REPLACEMENT", "CUSTOMER_REFILL_TEMPORARY_REPLACEMENT_RETURN"],
      },
    },
    include: {
      inventory: { select: { itemCode: true, name: true, unit: true } },
      createdByUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return { refill, stockMovements };
}
