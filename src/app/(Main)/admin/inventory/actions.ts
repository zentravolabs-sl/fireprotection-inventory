"use server";

// ============================================================
// src/app/(Main)/admin/inventory/actions.ts
// Server Actions for Inventory CRUD, search, and filters.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { inventorySchema, updateInventorySchema } from "@/lib/validations/inventory";
import type { ActionState } from "@/types/auth";
import type { IssueLocation } from "@/generated/prisma/client";

const INVENTORY_PATH = "/admin/inventory";

// ── Types ────────────────────────────────────────────────────

export type InventoryRow = {
  Id: number;
  ItemCode: string;
  Name: string;
  CategoryId: number;
  SubCategoryId: number;
  Brand: string | null;
  Unit: string;
  Qty: number;
  MinStock: number;
  RackLocation: string | null;
  Warehouse: string | null;
  BuyPrice: number;
  SellPrice: number;
  SupplierId: number | null;
  Barcode: string | null;
  ExpiryDate: Date | null;
  image_url: string | null;
  issueLocation: IssueLocation;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    categoryName: string;
  };
  subCategory: {
    id: number;
    name: string;
  };
  supplier: {
    Id: number;
    Company: string;
  } | null;
};

export type FilterParams = {
  search?: string;
  categoryId?: number;
  subCategoryId?: number;
  supplierId?: number;
  issueLocation?: IssueLocation;
  stockStatus?: "All" | "In Stock" | "Low Stock" | "Out Of Stock";
  expiryStatus?: "All" | "Expired" | "Expiring Soon" | "Valid";
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("ItemCode") || msg.includes("item_code")) {
      return "An inventory item with this Item Code already exists.";
    }
    if (msg.includes("Barcode") || msg.includes("barcode")) {
      return "An inventory item with this Barcode already exists.";
    }
  }
  console.error("[Inventory Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const inventorySelect = {
  Id: true,
  ItemCode: true,
  Name: true,
  CategoryId: true,
  SubCategoryId: true,
  Brand: true,
  Unit: true,
  Qty: true,
  MinStock: true,
  RackLocation: true,
  Warehouse: true,
  BuyPrice: true,
  SellPrice: true,
  SupplierId: true,
  Barcode: true,
  ExpiryDate: true,
  image_url: true,
  issueLocation: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, categoryName: true },
  },
  subCategory: {
    select: { id: true, name: true },
  },
  supplier: {
    select: { Id: true, Company: true },
  },
} as const;

// ── Queries ──────────────────────────────────────────────────

/**
 * Fetch SubCategories for a given CategoryId (for dependent dropdowns).
 */
export async function getSubCategoriesByCategoryId(categoryId: number) {
  if (!categoryId) return [];
  return prisma.subCategory.findMany({
    where: { categoryId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch inventory items with search & multi-faceted filtering.
 * Returns newest first.
 */
export async function getInventory(filters?: FilterParams): Promise<InventoryRow[]> {
  const search = filters?.search?.trim();
  const categoryId = filters?.categoryId;
  const subCategoryId = filters?.subCategoryId;
  const supplierId = filters?.supplierId;
  const issueLocation = filters?.issueLocation;
  const stockStatus = filters?.stockStatus;
  const expiryStatus = filters?.expiryStatus;

  // Build where conditions
  const where: any = {};

  if (categoryId) where.CategoryId = categoryId;
  if (subCategoryId) where.SubCategoryId = subCategoryId;
  if (supplierId) where.SupplierId = supplierId;
  if (issueLocation) where.issueLocation = issueLocation;

  if (search) {
    where.OR = [
      { ItemCode: { contains: search, mode: "insensitive" } },
      { Name: { contains: search, mode: "insensitive" } },
      { Barcode: { contains: search, mode: "insensitive" } },
      { Brand: { contains: search, mode: "insensitive" } },
      { category: { categoryName: { contains: search, mode: "insensitive" } } },
      { subCategory: { name: { contains: search, mode: "insensitive" } } },
      { supplier: { Company: { contains: search, mode: "insensitive" } } },
    ];
  }

  const records = await prisma.inventory.findMany({
    where,
    select: inventorySelect,
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Client-side filtering for Stock & Expiry Status if needed
  return records.filter((item) => {
    // Stock status filter
    if (stockStatus && stockStatus !== "All") {
      if (stockStatus === "Out Of Stock" && item.Qty !== 0) return false;
      if (stockStatus === "Low Stock" && (item.Qty === 0 || item.Qty > item.MinStock)) return false;
      if (stockStatus === "In Stock" && item.Qty <= item.MinStock) return false;
    }

    // Expiry status filter
    if (expiryStatus && expiryStatus !== "All") {
      if (!item.ExpiryDate) return expiryStatus === "Valid";
      const exp = new Date(item.ExpiryDate);
      exp.setHours(0, 0, 0, 0);

      if (expiryStatus === "Expired" && exp >= today) return false;
      if (expiryStatus === "Expiring Soon" && (exp < today || exp > thirtyDaysFromNow)) return false;
      if (expiryStatus === "Valid" && exp <= thirtyDaysFromNow) return false;
    }

    return true;
  });
}

/**
 * Fast search query for autocomplete/search suggestions.
 */
export async function searchInventory(query: string): Promise<InventoryRow[]> {
  const trimmed = query.trim();
  return prisma.inventory.findMany({
    where: trimmed
      ? {
          OR: [
            { ItemCode: { contains: trimmed, mode: "insensitive" } },
            { Name: { contains: trimmed, mode: "insensitive" } },
            { Barcode: { contains: trimmed, mode: "insensitive" } },
            { Brand: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: inventorySelect,
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single inventory item by Id.
 */
export async function getInventoryById(id: number): Promise<InventoryRow | null> {
  return prisma.inventory.findUnique({
    where: { Id: id },
    select: inventorySelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new Inventory record.
 */
export async function createInventory(
  formData: unknown
): Promise<ActionState<InventoryRow>> {
  const parsed = inventorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[createInventory Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Business Rule Checks
  if (data.SellPrice < data.BuyPrice) {
    return {
      success: false,
      message: "Sell price cannot be lower than buy price.",
      errors: { SellPrice: ["Sell price cannot be lower than buy price."] },
    };
  }

  // Check unique ItemCode
  const existingCode = await prisma.inventory.findUnique({
    where: { ItemCode: data.ItemCode },
    select: { Id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Item Code must be unique.",
      errors: { ItemCode: ["An item with this Item Code already exists."] },
    };
  }

  // Check unique Barcode if provided
  if (data.Barcode) {
    const existingBarcode = await prisma.inventory.findUnique({
      where: { Barcode: data.Barcode },
      select: { Id: true },
    });
    if (existingBarcode) {
      return {
        success: false,
        message: "Barcode must be unique.",
        errors: { Barcode: ["An item with this Barcode already exists."] },
      };
    }
  }

  try {
    const item = await prisma.inventory.create({
      data: {
        ItemCode: data.ItemCode,
        Name: data.Name,
        CategoryId: data.CategoryId,
        SubCategoryId: data.SubCategoryId,
        Brand: data.Brand || null,
        Unit: data.Unit,
        Qty: data.Qty,
        MinStock: data.MinStock,
        RackLocation: data.RackLocation || null,
        Warehouse: data.Warehouse || null,
        BuyPrice: data.BuyPrice,
        SellPrice: data.SellPrice,
        SupplierId: data.SupplierId || null,
        Barcode: data.Barcode || null,
        ExpiryDate: data.ExpiryDate ? new Date(data.ExpiryDate) : null,
        image_url: data.image_url || null,
        issueLocation: data.issueLocation,
      },
      select: inventorySelect,
    });

    revalidatePath(INVENTORY_PATH);
    return {
      success: true,
      message: "Inventory Created Successfully",
      data: item,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing Inventory record by Id.
 */
export async function updateInventory(
  formData: unknown
): Promise<ActionState<InventoryRow>> {
  const parsed = updateInventorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[updateInventory Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Business Rule Checks
  if (data.SellPrice < data.BuyPrice) {
    return {
      success: false,
      message: "Sell price cannot be lower than buy price.",
      errors: { SellPrice: ["Sell price cannot be lower than buy price."] },
    };
  }

  // Check unique ItemCode for other records
  const existingCode = await prisma.inventory.findFirst({
    where: { ItemCode: data.ItemCode, NOT: { Id: data.Id } },
    select: { Id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Item Code must be unique.",
      errors: { ItemCode: ["Another item with this Item Code already exists."] },
    };
  }

  // Check unique Barcode for other records if provided
  if (data.Barcode) {
    const existingBarcode = await prisma.inventory.findFirst({
      where: { Barcode: data.Barcode, NOT: { Id: data.Id } },
      select: { Id: true },
    });
    if (existingBarcode) {
      return {
        success: false,
        message: "Barcode must be unique.",
        errors: { Barcode: ["Another item with this Barcode already exists."] },
      };
    }
  }

  try {
    const item = await prisma.inventory.update({
      where: { Id: data.Id },
      data: {
        ItemCode: data.ItemCode,
        Name: data.Name,
        CategoryId: data.CategoryId,
        SubCategoryId: data.SubCategoryId,
        Brand: data.Brand || null,
        Unit: data.Unit,
        Qty: data.Qty,
        MinStock: data.MinStock,
        RackLocation: data.RackLocation || null,
        Warehouse: data.Warehouse || null,
        BuyPrice: data.BuyPrice,
        SellPrice: data.SellPrice,
        SupplierId: data.SupplierId || null,
        Barcode: data.Barcode || null,
        ExpiryDate: data.ExpiryDate ? new Date(data.ExpiryDate) : null,
        image_url: data.image_url || null,
        issueLocation: data.issueLocation,
      },
      select: inventorySelect,
    });

    revalidatePath(INVENTORY_PATH);
    return {
      success: true,
      message: "Inventory Updated Successfully",
      data: item,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete an Inventory record by Id.
 */
export async function deleteInventory(id: number): Promise<ActionState> {
  try {
    await prisma.inventory.delete({ where: { Id: id } });
    revalidatePath(INVENTORY_PATH);
    return {
      success: true,
      message: "Inventory Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
