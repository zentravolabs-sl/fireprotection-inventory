// ============================================================
// src/lib/services/expiryService.ts
// Core Business Logic & Database Queries for Expiry Management Module.
// Handles status calculation, FEFO, valuation, notifications, reports & calendar.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { ExpiryFilterInput, ExpiryStatusType } from "@/lib/validations/expiry";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExpiryBatchDetail {
  id: number;
  batchNo: string | null;
  receivedQty: number;
  availableQty: number;
  unitCost: number;
  stockValue: number;
  manufactureDate: Date | null;
  expiryDate: Date | null;
  receiveDate: Date;
  warehouse: string | null;
  rackLocation: string | null;
  daysRemaining: number | null;
  status: ExpiryStatusType;
  inventory: {
    id: number;
    itemCode: string;
    name: string;
    brand: string | null;
    category: { id: number; categoryName: string };
    subCategory: { id: number; name: string };
    expiryControlled: boolean;
  };
  supplier: {
    id: number;
    company: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface ExpiryDashboardSummary {
  expiredBatchesCount: number;
  expiredStockValue: number;
  expiring7DaysCount: number;
  expiring7DaysValue: number;
  expiring30DaysCount: number;
  expiring30DaysValue: number;
  validBatchesCount: number;
  validStockValue: number;
  noExpiryBatchesCount: number;
  noExpiryStockValue: number;
  totalExpiryControlledItems: number;
  thresholdDays: number;
  topExpiringItems: ExpiryBatchDetail[];
}

export interface SupplierExpirySummary {
  supplierId: number;
  company: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  totalExpiringBatches: number;
  totalExpiringValue: number;
  totalExpiredBatches: number;
  totalExpiredValue: number;
  items: ExpiryBatchDetail[];
}

export interface ExpiryCalendarEvent {
  id: number;
  batchNo: string;
  itemCode: string;
  itemName: string;
  supplierName: string;
  expiryDate: string; // ISO
  availableQty: number;
  unitCost: number;
  stockValue: number;
  daysRemaining: number | null;
  status: ExpiryStatusType;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function computeExpiryStatus(
  expiryDate: Date | null,
  thresholdDays: number = 30,
  referenceDate: Date = new Date()
): { status: ExpiryStatusType; daysRemaining: number | null } {
  if (!expiryDate) {
    return { status: "NO_EXPIRY", daysRemaining: null };
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: "EXPIRED", daysRemaining };
  }

  if (daysRemaining <= thresholdDays) {
    return { status: "EXPIRING_SOON", daysRemaining };
  }

  return { status: "VALID", daysRemaining };
}

export async function getSystemExpiryThreshold(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "EXPIRY_ALERT_THRESHOLD_DAYS" },
    });
    if (setting && setting.value) {
      const val = parseInt(setting.value, 10);
      if (!isNaN(val) && [7, 14, 30, 60, 90].includes(val)) {
        return val;
      }
    }
  } catch (e) {
    // Fallback default
  }
  return 30;
}

export async function setSystemExpiryThreshold(thresholdDays: number): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: "EXPIRY_ALERT_THRESHOLD_DAYS" },
    update: { value: String(thresholdDays) },
    create: { key: "EXPIRY_ALERT_THRESHOLD_DAYS", value: String(thresholdDays) },
  });
}

// ── Batch Formatting Helper ──────────────────────────────────────────────────

function mapBatchToDetail(batch: any, thresholdDays: number): ExpiryBatchDetail {
  const supplier = batch.stockReceiveItem?.stockReceive?.supplier || null;
  const { status, daysRemaining } = computeExpiryStatus(batch.expiryDate, thresholdDays);
  const stockValue = batch.availableQty * batch.unitCost;

  return {
    id: batch.id,
    batchNo: batch.batchNo || `Batch #${batch.id}`,
    receivedQty: batch.receivedQty,
    availableQty: batch.availableQty,
    unitCost: batch.unitCost,
    stockValue,
    manufactureDate: batch.manufactureDate,
    expiryDate: batch.expiryDate,
    receiveDate: batch.receiveDate,
    warehouse: batch.warehouse || batch.inventory?.warehouse || null,
    rackLocation: batch.rackLocation || batch.inventory?.rackLocation || null,
    daysRemaining,
    status,
    inventory: {
      id: batch.inventory.id,
      itemCode: batch.inventory.itemCode,
      name: batch.inventory.name,
      brand: batch.inventory.brand,
      category: batch.inventory.category,
      subCategory: batch.inventory.subCategory,
      expiryControlled: batch.inventory.expiryControlled ?? false,
    },
    supplier: supplier
      ? {
          id: supplier.id,
          company: supplier.company,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
        }
      : null,
  };
}

// ── 1. Expiry Dashboard Query ────────────────────────────────────────────────

export async function getExpiryDashboardData(
  overrideThreshold?: number
): Promise<ExpiryDashboardSummary> {
  const thresholdDays = overrideThreshold ?? (await getSystemExpiryThreshold());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threshold7Date = new Date(today);
  threshold7Date.setDate(threshold7Date.getDate() + 7);

  const threshold30Date = new Date(today);
  threshold30Date.setDate(threshold30Date.getDate() + thresholdDays);

  const [
    allBatches,
    expiryControlledCount,
  ] = await Promise.all([
    prisma.stockBatch.findMany({
      where: {
        availableQty: { gt: 0 },
      },
      include: {
        inventory: {
          include: {
            category: true,
            subCategory: true,
          },
        },
        stockReceiveItem: {
          include: {
            stockReceive: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
      orderBy: [{ expiryDate: "asc" }, { id: "asc" }],
    }),
    prisma.inventory.count({
      where: { expiryControlled: true },
    }),
  ]);

  let expiredBatchesCount = 0;
  let expiredStockValue = 0;
  let expiring7DaysCount = 0;
  let expiring7DaysValue = 0;
  let expiring30DaysCount = 0;
  let expiring30DaysValue = 0;
  let validBatchesCount = 0;
  let validStockValue = 0;
  let noExpiryBatchesCount = 0;
  let noExpiryStockValue = 0;

  const topExpiringItems: ExpiryBatchDetail[] = [];

  for (const b of allBatches) {
    const detail = mapBatchToDetail(b, thresholdDays);

    if (detail.status === "NO_EXPIRY") {
      noExpiryBatchesCount++;
      noExpiryStockValue += detail.stockValue;
    } else if (detail.status === "EXPIRED") {
      expiredBatchesCount++;
      expiredStockValue += detail.stockValue;
      if (topExpiringItems.length < 10) topExpiringItems.push(detail);
    } else if (detail.status === "EXPIRING_SOON") {
      expiring30DaysCount++;
      expiring30DaysValue += detail.stockValue;

      if (detail.daysRemaining !== null && detail.daysRemaining <= 7) {
        expiring7DaysCount++;
        expiring7DaysValue += detail.stockValue;
      }
      if (topExpiringItems.length < 10) topExpiringItems.push(detail);
    } else {
      validBatchesCount++;
      validStockValue += detail.stockValue;
    }
  }

  return {
    expiredBatchesCount,
    expiredStockValue,
    expiring7DaysCount,
    expiring7DaysValue,
    expiring30DaysCount,
    expiring30DaysValue,
    validBatchesCount,
    validStockValue,
    noExpiryBatchesCount,
    noExpiryStockValue,
    totalExpiryControlledItems: expiryControlledCount,
    thresholdDays,
    topExpiringItems,
  };
}

// ── 2. Expiry Batches Query with Search, Filters & Pagination ─────────────────

export async function getExpiryBatches(filters?: ExpiryFilterInput) {
  const thresholdDays = filters?.expiryRange
    ? parseInt(filters.expiryRange, 10)
    : await getSystemExpiryThreshold();

  const page = filters?.page || 1;
  const limit = filters?.limit || 15;
  const skip = (page - 1) * limit;

  const where: any = {
    availableQty: { gt: 0 },
  };

  if (filters?.categoryId) {
    where.inventory = { ...where.inventory, categoryId: filters.categoryId };
  }
  if (filters?.subCategoryId) {
    where.inventory = { ...where.inventory, subCategoryId: filters.subCategoryId };
  }
  if (filters?.warehouse) {
    where.OR = [
      { warehouse: { contains: filters.warehouse, mode: "insensitive" } },
      { inventory: { warehouse: { contains: filters.warehouse, mode: "insensitive" } } },
    ];
  }
  if (filters?.supplierId) {
    where.stockReceiveItem = {
      stockReceive: {
        supplierId: filters.supplierId,
      },
    };
  }

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { batchNo: { contains: s, mode: "insensitive" } },
      { inventory: { name: { contains: s, mode: "insensitive" } } },
      { inventory: { itemCode: { contains: s, mode: "insensitive" } } },
      { stockReceiveItem: { stockReceive: { supplier: { company: { contains: s, mode: "insensitive" } } } } },
    ];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + thresholdDays);

  if (filters?.status) {
    if (filters.status === "NO_EXPIRY") {
      where.expiryDate = null;
    } else if (filters.status === "EXPIRED") {
      where.expiryDate = { lt: today };
    } else if (filters.status === "EXPIRING_SOON") {
      where.expiryDate = { gte: today, lte: windowEnd };
    } else if (filters.status === "VALID") {
      where.expiryDate = { gt: windowEnd };
    }
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.expiryDate = {
      ...(where.expiryDate || {}),
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {}),
    };
  }

  const [rawBatches, totalCount] = await Promise.all([
    prisma.stockBatch.findMany({
      where,
      include: {
        inventory: {
          include: {
            category: true,
            subCategory: true,
          },
        },
        stockReceiveItem: {
          include: {
            stockReceive: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
      orderBy: [{ expiryDate: "asc" }, { receiveDate: "asc" }],
      skip,
      take: limit,
    }),
    prisma.stockBatch.count({ where }),
  ]);

  const items = rawBatches.map((b) => mapBatchToDetail(b, thresholdDays));
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    items,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

// ── 3. Expiry Report Data ─────────────────────────────────────────────────────

export async function getExpiryReportData(filters?: ExpiryFilterInput) {
  const thresholdDays = filters?.expiryRange
    ? parseInt(filters.expiryRange, 10)
    : await getSystemExpiryThreshold();

  const where: any = { availableQty: { gt: 0 } };

  if (filters?.supplierId) {
    where.stockReceiveItem = { stockReceive: { supplierId: filters.supplierId } };
  }
  if (filters?.categoryId) {
    where.inventory = { categoryId: filters.categoryId };
  }

  const rawBatches = await prisma.stockBatch.findMany({
    where,
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
      stockReceiveItem: {
        include: { stockReceive: { include: { supplier: true } } },
      },
    },
    orderBy: [{ expiryDate: "asc" }, { receiveDate: "asc" }],
  });

  const details = rawBatches.map((b) => mapBatchToDetail(b, thresholdDays));

  // If status filter applied in JS if not in SQL
  const filtered = filters?.status
    ? details.filter((d) => d.status === filters.status)
    : details;

  const totalValue = filtered.reduce((acc, d) => acc + d.stockValue, 0);
  const totalQty = filtered.reduce((acc, d) => acc + d.availableQty, 0);

  return {
    items: filtered,
    totalItemsCount: filtered.length,
    totalQty,
    totalValue,
  };
}

// ── 4. Supplier Expiry Report ─────────────────────────────────────────────────

export async function getSupplierExpiryReportData(
  filters?: ExpiryFilterInput
): Promise<SupplierExpirySummary[]> {
  const thresholdDays = filters?.expiryRange
    ? parseInt(filters.expiryRange, 10)
    : await getSystemExpiryThreshold();

  const suppliers = await prisma.supplier.findMany({
    orderBy: { company: "asc" },
  });

  const rawBatches = await prisma.stockBatch.findMany({
    where: {
      availableQty: { gt: 0 },
      expiryDate: { not: null },
    },
    include: {
      inventory: {
        include: { category: true, subCategory: true },
      },
      stockReceiveItem: {
        include: { stockReceive: { include: { supplier: true } } },
      },
    },
    orderBy: [{ expiryDate: "asc" }],
  });

  const supplierMap = new Map<number, SupplierExpirySummary>();

  for (const s of suppliers) {
    supplierMap.set(s.id, {
      supplierId: s.id,
      company: s.company,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      totalExpiringBatches: 0,
      totalExpiringValue: 0,
      totalExpiredBatches: 0,
      totalExpiredValue: 0,
      items: [],
    });
  }

  for (const b of rawBatches) {
    const detail = mapBatchToDetail(b, thresholdDays);
    const sId = detail.supplier?.id;
    if (!sId || !supplierMap.has(sId)) continue;

    const entry = supplierMap.get(sId)!;
    if (detail.status === "EXPIRED") {
      entry.totalExpiredBatches++;
      entry.totalExpiredValue += detail.stockValue;
      entry.items.push(detail);
    } else if (detail.status === "EXPIRING_SOON") {
      entry.totalExpiringBatches++;
      entry.totalExpiringValue += detail.stockValue;
      entry.items.push(detail);
    }
  }

  // Filter out suppliers with 0 expiring/expired items unless requested
  return Array.from(supplierMap.values()).filter(
    (s) => s.totalExpiringBatches > 0 || s.totalExpiredBatches > 0
  );
}

// ── 5. Expiry Calendar Events ──────────────────────────────────────────────────

export async function getExpiryCalendarEvents(
  month: number, // 1 - 12
  year: number
): Promise<ExpiryCalendarEvent[]> {
  const thresholdDays = await getSystemExpiryThreshold();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const batches = await prisma.stockBatch.findMany({
    where: {
      availableQty: { gt: 0 },
      expiryDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      inventory: { select: { itemCode: true, name: true } },
      stockReceiveItem: {
        include: { stockReceive: { include: { supplier: true } } },
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  return batches.map((b) => {
    const { status, daysRemaining } = computeExpiryStatus(b.expiryDate, thresholdDays);
    const stockValue = b.availableQty * b.unitCost;
    return {
      id: b.id,
      batchNo: b.batchNo || `Batch #${b.id}`,
      itemCode: b.inventory.itemCode,
      itemName: b.inventory.name,
      supplierName: b.stockReceiveItem?.stockReceive?.supplier?.company || "Unknown Supplier",
      expiryDate: b.expiryDate!.toISOString(),
      availableQty: b.availableQty,
      unit: "",
      unitCost: b.unitCost,
      stockValue,
      daysRemaining,
      status,
    };
  });
}

// ── 6. Batch Details Query (With Stock Movement Ledger) ───────────────────────

export async function getBatchExpiryDetails(batchId: number) {
  const thresholdDays = await getSystemExpiryThreshold();

  const batch = await prisma.stockBatch.findUnique({
    where: { id: batchId },
    include: {
      inventory: {
        include: {
          category: true,
          subCategory: true,
        },
      },
      stockReceiveItem: {
        include: {
          stockReceive: {
            include: {
              supplier: true,
              receivedByUser: { select: { id: true, name: true } },
            },
          },
        },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        include: {
          createdByUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!batch) return null;

  const detail = mapBatchToDetail(batch, thresholdDays);

  return {
    ...detail,
    stockReceiveNo: batch.stockReceiveItem?.stockReceive?.receiveNo || null,
    receivedByUser: batch.stockReceiveItem?.stockReceive?.receivedByUser?.name || null,
    movements: batch.stockMovements.map((m) => ({
      id: m.id,
      qty: m.qty,
      movementType: m.movementType,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      remarks: m.remarks,
      createdBy: m.createdByUser.name,
      createdAt: m.createdAt,
    })),
  };
}

// ── 7. Stock Issue & Transfer Expiry Validation ──────────────────────────────

export async function validateBatchExpiryForIssue(
  batchId: number,
  qty: number
): Promise<{ valid: boolean; error?: string }> {
  const batch = await prisma.stockBatch.findUnique({
    where: { id: batchId },
    select: { availableQty: true, expiryDate: true },
  });

  if (!batch) {
    return { valid: false, error: "Stock batch not found." };
  }

  if (batch.availableQty < qty) {
    return { valid: false, error: `Insufficient batch stock. Requested ${qty}, available: ${batch.availableQty}.` };
  }

  if (batch.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (batch.expiryDate < today) {
      return {
        valid: false,
        error: "This stock batch has expired and cannot be issued or transferred.",
      };
    }
  }

  return { valid: true };
}

export async function validateBatchExpiryForTransfer(
  batchId: number,
  qty: number
): Promise<{ valid: boolean; error?: string }> {
  return validateBatchExpiryForIssue(batchId, qty);
}

// ── 8. Cron / Scheduled Expiry Notification Check ────────────────────────────

export async function checkAndCreateExpiryNotifications(): Promise<{ createdCount: number }> {
  const thresholdDays = await getSystemExpiryThreshold();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threshold7Date = new Date(today);
  threshold7Date.setDate(threshold7Date.getDate() + 7);

  const threshold30Date = new Date(today);
  threshold30Date.setDate(threshold30Date.getDate() + thresholdDays);

  const batches = await prisma.stockBatch.findMany({
    where: {
      availableQty: { gt: 0 },
      expiryDate: { not: null },
    },
    include: {
      inventory: { select: { itemCode: true, name: true } },
    },
  });

  let createdCount = 0;

  for (const b of batches) {
    if (!b.expiryDate) continue;
    const { status, daysRemaining } = computeExpiryStatus(b.expiryDate, thresholdDays, today);

    let notifType: "EXPIRY_7_DAYS" | "EXPIRY_30_DAYS" | "STOCK_EXPIRED" | null = null;
    let title = "";
    let message = "";

    const batchName = b.batchNo || `Batch #${b.id}`;
    const itemName = `${b.inventory.name} (${b.inventory.itemCode})`;

    if (status === "EXPIRED") {
      notifType = "STOCK_EXPIRED";
      title = `Stock Expired: ${b.inventory.name}`;
      message = `${itemName} — ${batchName} has expired on ${b.expiryDate.toISOString().slice(0, 10)}. Available Qty: ${b.availableQty}.`;
    } else if (status === "EXPIRING_SOON" && daysRemaining !== null) {
      if (daysRemaining <= 7) {
        notifType = "EXPIRY_7_DAYS";
        title = `Expiring in 7 Days: ${b.inventory.name}`;
        message = `${itemName} — ${batchName} will expire in ${daysRemaining} day(s) on ${b.expiryDate.toISOString().slice(0, 10)}.`;
      } else if (daysRemaining <= thresholdDays) {
        notifType = "EXPIRY_30_DAYS";
        title = `Expiring in ${thresholdDays} Days: ${b.inventory.name}`;
        message = `${itemName} — ${batchName} will expire in ${daysRemaining} day(s) on ${b.expiryDate.toISOString().slice(0, 10)}.`;
      }
    }

    if (notifType) {
      // Check if notification already created today for this batch & type
      const startOfDay = new Date(today);
      const existing = await prisma.notification.findFirst({
        where: {
          batchId: b.id,
          type: notifType,
          createdAt: { gte: startOfDay },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            type: notifType,
            title,
            message,
            batchId: b.id,
          },
        });
        createdCount++;
      }
    }
  }

  return { createdCount };
}
