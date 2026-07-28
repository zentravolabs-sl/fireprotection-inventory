"use server";

// ============================================================
// src/app/(Main)/admin/customers/actions.ts
// Server Actions for Customer CRUD and real-time search.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import type { ActionState } from "@/types/auth";

const CUSTOMERS_PATH = "/admin/customers";

// ── Types ────────────────────────────────────────────────────

export type CustomerRow = {
  Id: number;
  CompanyName: string;
  ContactPerson: string | null;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("CompanyName") || msg.includes("company_name")) {
      return "A customer with this Company Name already exists.";
    }
  }
  console.error("[Customer Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const customerSelect = {
  Id: true,
  CompanyName: true,
  ContactPerson: true,
  Phone: true,
  Email: true,
  Address: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── Queries ──────────────────────────────────────────────────

/**
 * Fetch all customers or search by CompanyName, ContactPerson, Phone, Email.
 * Case-insensitive search, sorted newest first.
 */
export async function getCustomers(search?: string): Promise<CustomerRow[]> {
  const trimmed = search?.trim();

  return prisma.customer.findMany({
    where: trimmed
      ? {
          OR: [
            { CompanyName: { contains: trimmed, mode: "insensitive" } },
            { ContactPerson: { contains: trimmed, mode: "insensitive" } },
            { Phone: { contains: trimmed, mode: "insensitive" } },
            { Email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: customerSelect,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fast search query for autocomplete/search suggestions.
 */
export async function searchCustomers(query: string): Promise<CustomerRow[]> {
  const trimmed = query.trim();
  return prisma.customer.findMany({
    where: trimmed
      ? {
          OR: [
            { CompanyName: { contains: trimmed, mode: "insensitive" } },
            { ContactPerson: { contains: trimmed, mode: "insensitive" } },
            { Phone: { contains: trimmed, mode: "insensitive" } },
            { Email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: customerSelect,
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single customer by Id.
 */
export async function getCustomerById(id: number): Promise<CustomerRow | null> {
  return prisma.customer.findUnique({
    where: { Id: id },
    select: customerSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new Customer record.
 */
export async function createCustomer(
  formData: unknown
): Promise<ActionState<CustomerRow>> {
  const parsed = customerSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[createCustomer Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Check unique CompanyName
  const existingCompany = await prisma.customer.findUnique({
    where: { CompanyName: data.CompanyName },
    select: { Id: true },
  });
  if (existingCompany) {
    return {
      success: false,
      message: "Company Name must be unique.",
      errors: { CompanyName: ["A customer with this Company Name already exists."] },
    };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        CompanyName: data.CompanyName,
        ContactPerson: data.ContactPerson || null,
        Phone: data.Phone || null,
        Email: data.Email || null,
        Address: data.Address || null,
      },
      select: customerSelect,
    });

    revalidatePath(CUSTOMERS_PATH);
    return {
      success: true,
      message: "Customer Created Successfully",
      data: customer,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing Customer record by Id.
 */
export async function updateCustomer(
  formData: unknown
): Promise<ActionState<CustomerRow>> {
  const parsed = updateCustomerSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[updateCustomer Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Check unique CompanyName for other records
  const existingCompany = await prisma.customer.findFirst({
    where: { CompanyName: data.CompanyName, NOT: { Id: data.Id } },
    select: { Id: true },
  });
  if (existingCompany) {
    return {
      success: false,
      message: "Company Name must be unique.",
      errors: { CompanyName: ["Another customer with this Company Name already exists."] },
    };
  }

  try {
    const customer = await prisma.customer.update({
      where: { Id: data.Id },
      data: {
        CompanyName: data.CompanyName,
        ContactPerson: data.ContactPerson || null,
        Phone: data.Phone || null,
        Email: data.Email || null,
        Address: data.Address || null,
      },
      select: customerSelect,
    });

    revalidatePath(CUSTOMERS_PATH);
    return {
      success: true,
      message: "Customer Updated Successfully",
      data: customer,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete a Customer record by Id.
 */
export async function deleteCustomer(id: number): Promise<ActionState> {
  try {
    await prisma.customer.delete({ where: { Id: id } });
    revalidatePath(CUSTOMERS_PATH);
    return {
      success: true,
      message: "Customer Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
