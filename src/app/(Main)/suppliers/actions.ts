"use server";

// ============================================================
// src/app/(Main)/suppliers/actions.ts
// Server Actions for Supplier CRUD — updated to camelCase
// field names matching the new Prisma schema.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supplierSchema, updateSupplierSchema } from "@/lib/validations/supplier";
import type { ActionState } from "@/types/auth";

const SUPPLIERS_PATH = "/suppliers";

// ── Types ────────────────────────────────────────────────────

export type SupplierRow = {
  id: number;
  company: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("company"))
      return "A supplier with this company name already exists.";
  }
  if (
    msg.includes("Record to update not found") ||
    msg.includes("Record to delete does not exist")
  ) {
    return "Supplier record not found. It may have been already deleted.";
  }
  console.error("[Supplier Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const supplierSelect = {
  id: true,
  company: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface GetSuppliersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetSuppliersResult {
  suppliers: SupplierRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getSuppliers({
  search,
  page = 1,
  limit = 5,
}: GetSuppliersParams = {}): Promise<GetSuppliersResult> {
  const trimmed = search?.trim();
  const where = trimmed
    ? {
        OR: [
          { company: { contains: trimmed, mode: "insensitive" as const } },
          { contactPerson: { contains: trimmed, mode: "insensitive" as const } },
          { phone: { contains: trimmed, mode: "insensitive" as const } },
          { email: { contains: trimmed, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      select: supplierSelect,
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    suppliers,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

export async function searchSuppliers(query: string): Promise<SupplierRow[]> {
  const trimmed = query.trim();
  return prisma.supplier.findMany({
    where: trimmed
      ? {
          OR: [
            { company: { contains: trimmed, mode: "insensitive" } },
            { contactPerson: { contains: trimmed, mode: "insensitive" } },
            { phone: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: supplierSelect,
    take: 20,
    orderBy: { company: "asc" },
  });
}

export async function getSupplierById(id: number): Promise<SupplierRow | null> {
  return prisma.supplier.findUnique({
    where: { id },
    select: supplierSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

export async function createSupplier(
  formData: unknown
): Promise<ActionState<SupplierRow>> {
  const parsed = supplierSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { company, contactPerson, phone, email, address } = parsed.data;

  try {
    const supplier = await prisma.supplier.create({
      data: {
        company,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
      select: supplierSelect,
    });

    revalidatePath(SUPPLIERS_PATH);
    return { success: true, message: "Supplier created successfully.", data: supplier };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function updateSupplier(
  formData: unknown
): Promise<ActionState<SupplierRow>> {
  const parsed = updateSupplierSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { id, company, contactPerson, phone, email, address } = parsed.data;

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        company,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
      select: supplierSelect,
    });

    revalidatePath(SUPPLIERS_PATH);
    return { success: true, message: "Supplier updated successfully.", data: supplier };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

export async function deleteSupplier(id: number): Promise<ActionState> {
  // Guard: prevent deletion if referenced by StockReceives
  const receiveCount = await prisma.stockReceive.count({
    where: { supplierId: id },
  });

  if (receiveCount > 0) {
    return {
      success: false,
      message: `This supplier has ${receiveCount} receive order(s) and cannot be deleted.`,
    };
  }

  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath(SUPPLIERS_PATH);
    return { success: true, message: "Supplier deleted successfully." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
