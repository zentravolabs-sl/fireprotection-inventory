"use server";

// ============================================================
// src/app/(Main)/customers/actions.ts
// Server Actions for Customer CRUD, search, and filtering.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import type { ActionState } from "@/types/auth";

const CUSTOMERS_PATH = "/customers";

// ── Types ────────────────────────────────────────────────────

export type CustomerRow = {
  id: number;
  companyName: string;
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
    if (msg.includes("companyName") || msg.includes("company_name")) {
      return "A customer with this Company Name already exists.";
    }
  }
  console.error("[Customer Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const customerSelect = {
  id: true,
  companyName: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface GetCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetCustomersResult {
  customers: CustomerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getCustomers({
  search,
  page = 1,
  limit = 5,
}: GetCustomersParams = {}): Promise<GetCustomersResult> {
  const trimmed = search?.trim();
  const where = trimmed
    ? {
        OR: [
          { companyName: { contains: trimmed, mode: "insensitive" as const } },
          { contactPerson: { contains: trimmed, mode: "insensitive" as const } },
          { phone: { contains: trimmed, mode: "insensitive" as const } },
          { email: { contains: trimmed, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      select: customerSelect,
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    customers,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

export async function searchCustomers(query: string): Promise<CustomerRow[]> {
  const trimmed = query.trim();

  return prisma.customer.findMany({
    where: trimmed
      ? {
          OR: [
            { companyName: { contains: trimmed, mode: "insensitive" } },
            { contactPerson: { contains: trimmed, mode: "insensitive" } },
            { phone: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: customerSelect,
    take: 20,
    orderBy: { companyName: "asc" },
  });
}

export async function getCustomerById(id: number): Promise<CustomerRow | null> {
  return prisma.customer.findUnique({
    where: { id },
    select: customerSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

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

  const existingName = await prisma.customer.findUnique({
    where: { companyName: data.companyName },
    select: { id: true },
  });
  if (existingName) {
    return {
      success: false,
      message: "Company Name must be unique.",
      errors: { companyName: ["A customer with this Company Name already exists."] },
    };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
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

  const existingName = await prisma.customer.findFirst({
    where: { companyName: data.companyName, NOT: { id: data.id } },
    select: { id: true },
  });
  if (existingName) {
    return {
      success: false,
      message: "Company Name must be unique.",
      errors: { companyName: ["Another customer with this Company Name already exists."] },
    };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id: data.id },
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
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

export async function deleteCustomer(id: number): Promise<ActionState> {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath(CUSTOMERS_PATH);
    return {
      success: true,
      message: "Customer Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
