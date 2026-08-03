"use server";

// ============================================================
// src/app/(Main)/admin/inventory/actions.ts
// Server Actions for Inventory master CRUD.
// Current stock is computed via SUM(StockBatch.availableQty).
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { inventorySchema, updateInventorySchema } from "@/lib/validations/inventory";
import type { ActionState } from "@/types/auth";

const INVENTORY_PATH = "/admin/inventory";

// ── Types ────────────────────────────────────────────────────

export type InventoryRow = {
  id: number;
  itemCode: string;
  name: string;
  brand: string | null;
  unit: string;
  minStock: number;
  barcode: string | null;
  rackLocation: string | null;
  warehouse: string | null;
  defaultSellPrice: number;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number;
  subCategoryId: number;
  category: { id: number; categoryName: string };
  subCategory: { id: number; name: string };
  currentStock: number;
};

export type FilterParams = {
  search?: string;
  categoryId?: number;
  subCategoryId?: number;
  warehouse?: string;
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("itemCode") || msg.includes("item_code"))
      return "An item with this Item Code already exists.";
    if (msg.includes("barcode"))
      return "An item with this Barcode already exists.";
  }
  console.error("[Inventory Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const inventorySelect = {
  id: true,
  itemCode: true,
  name: true,
  brand: true,
  unit: true,
  minStock: true,
  barcode: true,
  rackLocation: true,
  warehouse: true,
  defaultSellPrice: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  subCategoryId: true,
  category: { select: { id: true, categoryName: true } },
  subCategory: { select: { id: true, name: true } },
} as const;

// ── Queries ──────────────────────────────────────────────────

export async function getSubCategoriesByCategoryId(categoryId: number) {
  if (!categoryId) return [];
  return prisma.subCategory.findMany({
    where: { categoryId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getInventory(filters?: FilterParams): Promise<InventoryRow[]> {
  const where: Record<string, unknown> = {};

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.subCategoryId) where.subCategoryId = filters.subCategoryId;
  if (filters?.warehouse) where.warehouse = filters.warehouse;

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { itemCode: { contains: s, mode: "insensitive" } },
      { name: { contains: s, mode: "insensitive" } },
      { barcode: { contains: s, mode: "insensitive" } },
      { brand: { contains: s, mode: "insensitive" } },
      { category: { categoryName: { contains: s, mode: "insensitive" } } },
      { subCategory: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const items = await prisma.inventory.findMany({
    where,
    select: {
      ...inventorySelect,
      stockBatches: {
        select: { availableQty: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items
    .map((item) => {
      const currentStock = item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0);
      const { stockBatches: _, ...rest } = item;
      return { ...rest, currentStock };
    })
    .filter((item) => {
      if (!filters?.stockStatus || filters.stockStatus === "all") return true;
      if (filters.stockStatus === "out_of_stock") return item.currentStock === 0;
      if (filters.stockStatus === "low_stock")
        return item.currentStock > 0 && item.currentStock <= item.minStock;
      if (filters.stockStatus === "in_stock") return item.currentStock > item.minStock;
      return true;
    });
}

export async function getInventoryById(id: number): Promise<InventoryRow | null> {
  const item = await prisma.inventory.findUnique({
    where: { id },
    select: {
      ...inventorySelect,
      stockBatches: { select: { availableQty: true } },
    },
  });
  if (!item) return null;
  const currentStock = item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0);
  const { stockBatches: _, ...rest } = item;
  return { ...rest, currentStock };
}

/** For dropdown selectors in forms */
export async function getInventoryList() {
  return prisma.inventory.findMany({
    select: { id: true, itemCode: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });
}

// ── Mutations ────────────────────────────────────────────────

export async function createInventory(
  formData: unknown
): Promise<ActionState<InventoryRow>> {
  const parsed = inventorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  const existingCode = await prisma.inventory.findUnique({
    where: { itemCode: data.itemCode },
    select: { id: true },
  });
  if (existingCode) {
    return { success: false, message: "Item Code must be unique.", errors: { itemCode: ["This Item Code already exists."] } };
  }

  if (data.barcode) {
    const existingBarcode = await prisma.inventory.findUnique({
      where: { barcode: data.barcode },
      select: { id: true },
    });
    if (existingBarcode) {
      return { success: false, message: "Barcode must be unique.", errors: { barcode: ["This Barcode already exists."] } };
    }
  }

  try {
    const item = await prisma.inventory.create({
      data: {
        itemCode: data.itemCode,
        name: data.name,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        brand: data.brand ?? null,
        unit: data.unit,
        minStock: data.minStock,
        barcode: data.barcode ?? null,
        rackLocation: data.rackLocation ?? null,
        warehouse: data.warehouse ?? null,
        defaultSellPrice: data.defaultSellPrice,
        imageUrl: data.imageUrl ?? null,
      },
      select: {
        ...inventorySelect,
        stockBatches: { select: { availableQty: true } },
      },
    });
    revalidatePath(INVENTORY_PATH);
    const currentStock = item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0);
    const { stockBatches: _, ...rest } = item;
    return { success: true, message: "Inventory item created successfully.", data: { ...rest, currentStock } };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function updateInventory(
  formData: unknown
): Promise<ActionState<InventoryRow>> {
  const parsed = updateInventorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: Object.values(errors).flat()[0] || "Validation failed.", errors };
  }

  const data = parsed.data;

  const existingCode = await prisma.inventory.findFirst({
    where: { itemCode: data.itemCode, NOT: { id: data.id } },
    select: { id: true },
  });
  if (existingCode) {
    return { success: false, message: "Item Code must be unique.", errors: { itemCode: ["Another item has this Item Code."] } };
  }

  if (data.barcode) {
    const existingBarcode = await prisma.inventory.findFirst({
      where: { barcode: data.barcode, NOT: { id: data.id } },
      select: { id: true },
    });
    if (existingBarcode) {
      return { success: false, message: "Barcode must be unique.", errors: { barcode: ["Another item has this Barcode."] } };
    }
  }

  try {
    const item = await prisma.inventory.update({
      where: { id: data.id },
      data: {
        itemCode: data.itemCode,
        name: data.name,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        brand: data.brand ?? null,
        unit: data.unit,
        minStock: data.minStock,
        barcode: data.barcode ?? null,
        rackLocation: data.rackLocation ?? null,
        warehouse: data.warehouse ?? null,
        defaultSellPrice: data.defaultSellPrice,
        imageUrl: data.imageUrl ?? null,
      },
      select: {
        ...inventorySelect,
        stockBatches: { select: { availableQty: true } },
      },
    });
    revalidatePath(INVENTORY_PATH);
    const currentStock = item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0);
    const { stockBatches: _, ...rest } = item;
    return { success: true, message: "Inventory item updated successfully.", data: { ...rest, currentStock } };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function deleteInventory(id: number): Promise<ActionState> {
  try {
    await prisma.inventory.delete({ where: { id } });
    revalidatePath(INVENTORY_PATH);
    return { success: true, message: "Inventory item deleted successfully." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
