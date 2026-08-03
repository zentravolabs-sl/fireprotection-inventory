// ============================================================
// src/lib/validations/customer.ts
// Zod v4 validation schemas for Customer CRUD module.
// ============================================================

import { z } from "zod";

export const customerSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required.")
    .min(2, "Company name must be at least 2 characters.")
    .max(150, "Company name must be no more than 150 characters.")
    .trim(),

  contactPerson: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (!val || val === "" ? null : val.trim())),

  phone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => (!val || val === "" ? null : val.trim())),

  email: z
    .string()
    .email("Please enter a valid email address.")
    .optional()
    .nullable()
    .transform((val) => (!val || val === "" ? null : val.trim().toLowerCase())),

  address: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (!val || val === "" ? null : val.trim())),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const updateCustomerSchema = customerSchema.extend({
  id: z.coerce.number({ message: "Invalid customer ID." }).int().positive(),
});

export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;
