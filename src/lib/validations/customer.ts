// ============================================================
// src/lib/validations/customer.ts
// Zod v4 validation schemas for Customer CRUD module.
// ============================================================

import { z } from "zod";

export const customerSchema = z.object({
  CompanyName: z
    .string()
    .min(1, "Company name is required.")
    .min(2, "Company name must be at least 2 characters.")
    .max(150, "Company name must be no more than 150 characters.")
    .trim(),

  ContactPerson: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (!val || val === "" ? null : val.trim())),

  Phone: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (!val || val === "" ? null : val.trim())),

  Email: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (!val || val === "" ? null : val.trim().toLowerCase()))
    .pipe(
      z
        .string()
        .email("Please enter a valid email address.")
        .nullable()
        .or(z.null())
    ),

  Address: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (!val || val === "" ? null : val.trim())),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const updateCustomerSchema = customerSchema.extend({
  Id: z.number({ message: "Invalid customer ID." }).int().positive(),
});

export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;
