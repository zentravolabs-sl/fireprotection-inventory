// ============================================================
// src/lib/services/weeklyStockReportService.ts
// Data aggregation service for the Weekly Stock Report.
// Queries the existing Prisma schema — NO new models created.
//
// Key tables used:
//   Inventory  — master item list with minStock, name, unit
//   StockBatch — source of truth: availableQty per batch
//   StockMovement — immutable ledger: movementType, qty, createdAt
//   Category   — item classification
// ============================================================

import { prisma } from "@/lib/prisma";
import type {
  StockMovementItem,
  TopUsedItem,
  LowStockItem,
  OutOfStockItem,
} from "../../../emails/WeeklyStockReportEmail";

// ── Config ───────────────────────────────────────────────────

const TOP_USED_LIMIT = 10;
const LOW_STOCK_LIMIT = 20;
const OUT_OF_STOCK_LIMIT = 20;

// ── Return type ──────────────────────────────────────────────

export interface WeeklyStockReportData {
  reportPeriod: { from: Date; to: Date };
  summary: {
    openingStock: number;
    stockIn: number;
    stockOut: number;
    adjustments: number;
    currentStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  stockMovementItems: StockMovementItem[];
  topUsedItems: TopUsedItem[];
  lowStockItems: LowStockItem[];
  outOfStockItems: OutOfStockItem[];
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Returns the Monday 00:00:00 IST and Friday 23:59:59 IST
 * for the week that contains `referenceDate`.
 * We store all DB times in UTC, so we compute offsets manually.
 *
 * IST = UTC + 5:30 → UTC = IST - 5:30
 */
export function getWeekBounds(referenceDate: Date = new Date()): {
  from: Date;
  to: Date;
} {
  // IST offset in minutes
  const IST_OFFSET_MS = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;

  // Current time in IST as a plain date
  const istNow = new Date(referenceDate.getTime() + IST_OFFSET_MS);

  // Day of week in IST: 0 = Sunday, 1 = Monday, …, 5 = Friday, 6 = Saturday
  const dayOfWeek = istNow.getUTCDay();

  // Days since Monday (Sunday → 6 days back to previous Monday)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Monday 00:00:00 IST
  const mondayIST = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate() - daysSinceMonday,
      0, 0, 0, 0
    )
  );

  // Friday 23:59:59.999 IST
  const fridayIST = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate() - daysSinceMonday + 4,
      23, 59, 59, 999
    )
  );

  // Convert IST times back to UTC for DB queries
  const fromUTC = new Date(mondayIST.getTime() - IST_OFFSET_MS);
  const toUTC = new Date(fridayIST.getTime() - IST_OFFSET_MS);

  // The from/to we return as Date for display are the IST-anchored boundaries
  // but represented in UTC so JS Date doesn't re-apply TZ offset
  return { from: fromUTC, to: toUTC };
}

// ── Main service function ─────────────────────────────────────

/**
 * Generates all data required by WeeklyStockReportEmail.
 * Runs multiple parallel Prisma queries for performance.
 *
 * @param from  Start of reporting window (UTC)
 * @param to    End of reporting window (UTC)
 */
export async function getWeeklyStockReport(
  from?: Date,
  to?: Date
): Promise<WeeklyStockReportData> {
  const bounds = from && to ? { from, to } : getWeekBounds();
  const { from: weekStart, to: weekEnd } = bounds;

  // ── 1. Aggregate stock IN this week (movementType = IN) ──
  // ── 2. Aggregate stock OUT (OUT, TRANSFER) ──
  // ── 3. Aggregate ADJUSTMENTS (positive net) ──
  // ── 4. Current stock = SUM(StockBatch.availableQty) per inventory ──
  // ── 5. Per-item movement for table ──
  // All queries run in parallel

  const [
    stockInAgg,
    stockOutAgg,
    adjustmentAgg,
    currentBatchTotals,
    movementsByItem,
    allInventory,
  ] = await Promise.all([
    // 1. Total stock IN this week
    prisma.stockMovement.aggregate({
      where: {
        movementType: "IN",
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { qty: true },
    }),

    // 2. Total stock OUT (OUT + TRANSFER) this week
    prisma.stockMovement.aggregate({
      where: {
        movementType: { in: ["OUT", "TRANSFER"] },
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { qty: true },
    }),

    // 3. Net adjustments this week
    prisma.stockMovement.aggregate({
      where: {
        movementType: "ADJUSTMENT",
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { qty: true },
    }),

    // 4. Current stock: sum of availableQty per inventory item
    prisma.stockBatch.groupBy({
      by: ["inventoryId"],
      _sum: { availableQty: true },
    }),

    // 5. Per-item movements this week (IN + OUT + TRANSFER)
    prisma.stockMovement.groupBy({
      by: ["inventoryId", "movementType"],
      where: {
        movementType: { in: ["IN", "OUT", "TRANSFER"] },
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { qty: true },
    }),

    // 6. All inventory items with category for joining
    prisma.inventory.findMany({
      select: {
        id: true,
        name: true,
        minStock: true,
        category: { select: { categoryName: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // ── Build lookup maps ─────────────────────────────────────

  // inventoryId → current stock
  const currentStockMap = new Map<number, number>();
  for (const row of currentBatchTotals) {
    currentStockMap.set(row.inventoryId, row._sum.availableQty ?? 0);
  }

  // inventoryId → { in: number, out: number }
  const weekMovementMap = new Map<number, { in: number; out: number }>();
  for (const row of movementsByItem) {
    const existing = weekMovementMap.get(row.inventoryId) ?? { in: 0, out: 0 };
    const qty = row._sum.qty ?? 0;
    if (row.movementType === "IN") {
      existing.in += qty;
    } else {
      // OUT or TRANSFER
      existing.out += qty;
    }
    weekMovementMap.set(row.inventoryId, existing);
  }

  // inventoryId → inventory master (used by the movement detail loop below)
  const inventoryMap = new Map(allInventory.map((i) => [i.id, i]));


  // ── Compute totals ────────────────────────────────────────

  const totalStockIn = stockInAgg._sum.qty ?? 0;
  const totalStockOut = stockOutAgg._sum.qty ?? 0;
  const totalAdjustments = adjustmentAgg._sum.qty ?? 0;
  const totalCurrentStock = currentBatchTotals.reduce(
    (sum, r) => sum + (r._sum.availableQty ?? 0),
    0
  );
  // Opening stock = current − received + used − adjustments
  const openingStock = Math.max(0, totalCurrentStock - totalStockIn + totalStockOut - totalAdjustments);

  // ── Low stock & out of stock ──────────────────────────────

  const lowStockItems: LowStockItem[] = [];
  const outOfStockItems: OutOfStockItem[] = [];

  for (const inv of allInventory) {
    const current = currentStockMap.get(inv.id) ?? 0;
    const category = inv.category?.categoryName ?? "Uncategorised";

    if (current === 0 && inv.minStock > 0 && outOfStockItems.length < OUT_OF_STOCK_LIMIT) {
      outOfStockItems.push({
        name: inv.name,
        categoryName: category,
        minStock: inv.minStock,
        unit: "",
      });
    } else if (current > 0 && current < inv.minStock && lowStockItems.length < LOW_STOCK_LIMIT) {
      lowStockItems.push({
        name: inv.name,
        categoryName: category,
        currentStock: current,
        minStock: inv.minStock,
        requiredQty: inv.minStock - current,
        unit: "",
      });
    }
  }

  // Sort low stock by required qty descending (most urgent first)
  lowStockItems.sort((a, b) => b.requiredQty - a.requiredQty);

  // ── Stock movement detail table (items with movement this week) ──

  const stockMovementItems: StockMovementItem[] = [];
  for (const [inventoryId, movement] of weekMovementMap.entries()) {
    if (movement.in === 0 && movement.out === 0) continue;
    const inv = inventoryMap.get(inventoryId);
    if (!inv) continue;

    const currentQty = currentStockMap.get(inventoryId) ?? 0;
    // Opening for this item = current + used - received (this week)
    const itemOpening = Math.max(0, currentQty - movement.in + movement.out);

    stockMovementItems.push({
      name: inv.name,
      categoryName: inv.category?.categoryName ?? "Uncategorised",
      openingQty: itemOpening,
      receivedQty: movement.in,
      usedQty: movement.out,
      remainingQty: currentQty,
    });
  }

  // Sort by highest usage first
  stockMovementItems.sort((a, b) => b.usedQty - a.usedQty);

  // ── Top used items ────────────────────────────────────────

  // Build name→unit map for clean resolution
  const nameToUnit = new Map(allInventory.map((i) => [i.name, ""]));

  const topUsedItems: TopUsedItem[] = stockMovementItems
    .filter((i) => i.usedQty > 0)
    .slice(0, TOP_USED_LIMIT)
    .map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      categoryName: item.categoryName,
      usedQty: item.usedQty,
      unit: nameToUnit.get(item.name) ?? "",
    }));

  return {
    reportPeriod: {
      // Convert UTC bounds back to IST for display in the email
      from: new Date(weekStart.getTime() + 5.5 * 60 * 60 * 1000),
      to: new Date(weekEnd.getTime() + 5.5 * 60 * 60 * 1000),
    },
    summary: {
      openingStock: Math.round(openingStock),
      stockIn: Math.round(totalStockIn),
      stockOut: Math.round(totalStockOut),
      adjustments: Math.round(totalAdjustments),
      currentStock: Math.round(totalCurrentStock),
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
    },
    stockMovementItems,
    topUsedItems,
    lowStockItems,
    outOfStockItems,
  };
}
