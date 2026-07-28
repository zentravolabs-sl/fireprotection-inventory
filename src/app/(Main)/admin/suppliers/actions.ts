"use server";

// ============================================================
// src/app/(Main)/admin/suppliers/actions.ts
// Server Actions for Supplier CRUD operations.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supplierSchema, updateSupplierSchema } from "@/lib/validations/supplier";
import type { ActionState } from "@/types/auth";
import type { Supplier } from "@/generated/prisma/client";

const SUPPLIERS_PATH = "/admin/suppliers";

// ── Types ────────────────────────────────────────────────────

export type SupplierRow = Pick<
  Supplier,
  "Id" | "Company" | "ContactPerson" | "Phone" | "Email" | "Address" | "createdAt" | "updatedAt"
>;

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("Company") || msg.includes("company")) {
      return "A supplier with this company name already exists.";
    }
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
  Id: true,
  Company: true,
  ContactPerson: true,
  Phone: true,
  Email: true,
  Address: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── Queries ──────────────────────────────────────────────────

/**
 * Fetch all suppliers, optionally filtered by search term.
 * Searches across Company, ContactPerson, Phone, and Email using Prisma contains (case-insensitive).
 * Returns newest first.
 */
export async function getSuppliers(search?: string): Promise<SupplierRow[]> {
  const trimmed = search?.trim();
  return prisma.supplier.findMany({
    where: trimmed
      ? {
          OR: [
            { Company: { contains: trimmed, mode: "insensitive" } },
            { ContactPerson: { contains: trimmed, mode: "insensitive" } },
            { Phone: { contains: trimmed, mode: "insensitive" } },
            { Email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: supplierSelect,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fast search query for searchable dropdowns or autocomplete components.
 */
export async function searchSuppliers(query: string): Promise<SupplierRow[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return prisma.supplier.findMany({
      select: supplierSelect,
      take: 20,
      orderBy: { Company: "asc" },
    });
  }

  return prisma.supplier.findMany({
    where: {
      OR: [
        { Company: { contains: trimmed, mode: "insensitive" } },
        { ContactPerson: { contains: trimmed, mode: "insensitive" } },
        { Phone: { contains: trimmed, mode: "insensitive" } },
        { Email: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: supplierSelect,
    take: 20,
    orderBy: { Company: "asc" },
  });
}

/**
 * Fetch a single supplier by Id.
 */
export async function getSupplierById(id: number): Promise<SupplierRow | null> {
  return prisma.supplier.findUnique({
    where: { Id: id },
    select: supplierSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new Supplier.
 */
export async function createSupplier(
  formData: unknown
): Promise<ActionState<SupplierRow>> {
  const parsed = supplierSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { Company, ContactPerson, Phone, Email, Address } = parsed.data;

  try {
    const supplier = await prisma.supplier.create({
      data: {
        Company,
        ContactPerson: ContactPerson || null,
        Phone: Phone || null,
        Email: Email || null,
        Address: Address || null,
      },
      select: supplierSelect,
    });

    revalidatePath(SUPPLIERS_PATH);
    return {
      success: true,
      message: "Supplier Created Successfully",
      data: supplier,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing Supplier by Id.
 */
export async function updateSupplier(
  formData: unknown
): Promise<ActionState<SupplierRow>> {
  const parsed = updateSupplierSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { Id, Company, ContactPerson, Phone, Email, Address } = parsed.data;

  try {
    const supplier = await prisma.supplier.update({
      where: { Id },
      data: {
        Company,
        ContactPerson: ContactPerson || null,
        Phone: Phone || null,
        Email: Email || null,
        Address: Address || null,
      },
      select: supplierSelect,
    });

    revalidatePath(SUPPLIERS_PATH);
    return {
      success: true,
      message: "Supplier Updated Successfully",
      data: supplier,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete a Supplier by Id.
 * Enforces DELETE RULE: Prevent deletion if referenced by 1 or more Inventory records.
 */
export async function deleteSupplier(id: number): Promise<ActionState> {
  // Check if referenced by Inventory records
  const inventoryCount = await prisma.inventory.count({
    where: { SupplierId: id },
  });

  if (inventoryCount > 0) {
    return {
      success: false,
      message: "This supplier is assigned to inventory items and cannot be deleted.",
    };
  }

  try {
    await prisma.supplier.delete({ where: { Id: id } });
    revalidatePath(SUPPLIERS_PATH);
    return {
      success: true,
      message: "Supplier Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
