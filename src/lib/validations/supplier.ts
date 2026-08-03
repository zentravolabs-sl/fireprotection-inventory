// ============================================================
// src/lib/validations/supplier.ts
// Zod v4 schemas for Supplier CRUD — updated to camelCase
// to match the new Prisma schema field names.
// ============================================================

import { z } from "zod";

export const supplierSchema = z.object({
  company: z
    .string()
    .min(1, "Company name is required.")
    .min(2, "Company name must be at least 2 characters.")
    .max(150, "Company name must be no more than 150 characters.")
    .trim(),

  contactPerson: z
    .string()
    .max(100, "Contact person must be no more than 100 characters.")
    .trim()
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .max(20, "Phone number must be no more than 20 characters.")
    .trim()
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      { message: "Must be a valid email address." }
    ),

  address: z
    .string()
    .max(500, "Address must be no more than 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const updateSupplierSchema = supplierSchema.extend({
  id: z.number({ error: "Invalid supplier ID." }).int().positive(),
});

export type UpdateSupplierFormValues = z.infer<typeof updateSupplierSchema>;
