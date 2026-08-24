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
  returnedItems: {
    itemId: number;
    returnQty: number;
    refillDate?: string | null;
    expireDate?: string | null;
  }[];
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
  return await prisma.$transaction(
    async (tx) => {
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

      // 2. Create CustomerRefillItem rows in parallel (NO stock impact — customer-owned)
      await Promise.all(
        input.items.map((item) =>
          tx.customerRefillItem.create({
            data: {
              customerRefillId: refill.id,
              extinguisherType: item.extinguisherType.trim(),
              capacity: item.capacity?.trim() || null,
              receivedQty: item.receivedQty,
              returnedQty: 0,
              notes: item.notes?.trim() || null,
            },
          })
        )
      );

      // 3. Issue temporary replacements from OUR warehouse (if requested)
      // FIFO consumption must remain sequential per replacement item
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

          // Consume FIFO — sequential by design (each batch modifies the next remaining qty)
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
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
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
  return await prisma.$transaction(
    async (tx) => {
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

      // ── Validate all quantities up-front (no DB calls) ──
      const itemUpdates: { id: number; newQty: number; refillDate?: Date; expireDate?: Date }[] = [];
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
        itemUpdates.push({
          id: existing.id,
          newQty: newReturnedQty,
          ...(r.refillDate ? { refillDate: new Date(r.refillDate) } : {}),
          ...(r.expireDate ? { expireDate: new Date(r.expireDate) } : {}),
        });
      }

      const replUpdates: { id: number; inventoryId: number; newQty: number; issuedQty: number; name: string; returnQty: number }[] = [];
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
        replUpdates.push({
          id: existing.id,
          inventoryId: existing.inventoryId,
          newQty: newReturnedQty,
          issuedQty: existing.issuedQty,
          name: existing.inventory.name,
          returnQty: r.returnQty,
        });
      }

      // ── Step 1: Batch-update customer-owned items in parallel ──
      await Promise.all(
        itemUpdates.map((u) =>
          tx.customerRefillItem.update({
            where: { id: u.id },
            data: {
              returnedQty: u.newQty,
              ...(u.refillDate ? { refillDate: u.refillDate } : {}),
              ...(u.expireDate ? { expireDate: u.expireDate } : {}),
            },
          })
        )
      );

      // ── Step 2: For each replacement, fetch target batch then write in parallel ──
      // Fetch all needed batches first (parallel), then do writes
      const batchLookups = await Promise.all(
        replUpdates.map((r) =>
          tx.stockBatch.findFirst({
            where: { inventoryId: r.inventoryId },
            orderBy: { receiveDate: "desc" },
          })
        )
      );

      // Now do all replacement + stockBatch + stockMovement writes in parallel
      await Promise.all(
        replUpdates.map(async (r, idx) => {
          const targetBatch = batchLookups[idx];
          if (!targetBatch) {
            throw new Error(`No stock batch found to restore inventory (${r.name}).`);
          }

          const newStatus: ReplacementStatus =
            r.newQty >= r.issuedQty ? "RETURNED" : "PARTIALLY_RETURNED";

          await Promise.all([
            tx.customerRefillReplacement.update({
              where: { id: r.id },
              data: {
                returnedQty: r.newQty,
                status: newStatus,
                returnedDate: r.newQty >= r.issuedQty ? new Date() : null,
              },
            }),
            tx.stockBatch.update({
              where: { id: targetBatch.id },
              data: { availableQty: { increment: r.returnQty } },
            }),
            tx.stockMovement.create({
              data: {
                inventoryId: r.inventoryId,
                stockBatchId: targetBatch.id,
                qty: r.returnQty,
                movementType: "IN",
                referenceType: "CUSTOMER_REFILL_TEMPORARY_REPLACEMENT_RETURN",
                referenceId: refill.id,
                remarks: `Temp replacement returned for ${refill.refillNo} (${refill.customer.companyName})`,
                createdBy: actorId,
              },
            }),
          ]);
        })
      );

      // ── Step 3: Compute completion status from in-memory data (no extra DB round-trip) ──
      const updatedItemMap = new Map(itemUpdates.map((u) => [u.id, u.newQty]));
      const updatedReplMap = new Map(replUpdates.map((u) => [u.id, u.newQty]));

      const allItemsDone = refill.items.every((i) => {
        const qty = updatedItemMap.has(i.id) ? updatedItemMap.get(i.id)! : i.returnedQty;
        return qty >= i.receivedQty;
      });
      const allReplsDone = refill.replacements.every((r) => {
        const qty = updatedReplMap.has(r.id) ? updatedReplMap.get(r.id)! : r.returnedQty;
        return qty >= r.issuedQty;
      });
      const isComplete = allItemsDone && allReplsDone;

      // ── Step 4: Update header + fetch final state in parallel ──
      const [, updated] = await Promise.all([
        tx.customerRefill.update({
          where: { id: input.refillId },
          data: {
            status: isComplete ? "COMPLETED" : "READY_TO_RETURN",
            completedDate: isComplete ? new Date() : null,
          },
        }),
        tx.customerRefill.findUniqueOrThrow({
          where: { id: input.refillId },
          include: {
            customer: true,
            createdBy: { select: { id: true, name: true, email: true } },
            items: true,
            replacements: { include: { inventory: { select: { id: true, itemCode: true, name: true, unit: true } } } },
          },
        }),
      ]);

      return { ...updated, status: isComplete ? "COMPLETED" : ("READY_TO_RETURN" as const) };
    },
    {
      maxWait: 10000, // wait up to 10s for a connection slot
      timeout: 30000, // allow up to 30s for the transaction body
    }
  );
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

// ─── Expiry Warning Query ──────────────────────────────────────────────────────

/**
 * Returns CustomerRefillItems whose expireDate falls within the next `daysBefore` days (default 30).
 * Only includes items from non-cancelled refill jobs.
 */
export async function getExpiringRefillItemsService(daysBefore = 30) {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysBefore);

  return prisma.customerRefillItem.findMany({
    where: {
      expireDate: { not: null, lte: cutoff },
      customerRefill: {
        status: { notIn: ["CANCELLED"] },
      },
    },
    include: {
      customerRefill: {
        select: {
          id: true,
          refillNo: true,
          status: true,
          customer: { select: { id: true, companyName: true } },
        },
      },
    },
    orderBy: { expireDate: "asc" },
  });
}
