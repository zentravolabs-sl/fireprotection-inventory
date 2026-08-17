// ============================================================
// src/lib/validations/user.ts
// Zod v4 validation schemas for User Management forms.
// ============================================================

import { z } from "zod";

// ── Shared field rules ──────────────────────────────────────

const nameField = z
  .string()
  .min(2, "Name must be at least 2 characters.")
  .max(100, "Name must be no more than 100 characters.")
  .trim();

const emailField = z
  .string()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .trim()
  .toLowerCase();

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be no more than 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

const roleField = z.enum(
  [
    "SUPER_ADMIN",
    "ADMIN",
    "GENERAL_MANAGER",
    "PROJECT_MANAGER",
    "ENGINEER",
    "ACCOUNTANT",
    "USER",
  ],
  { error: "Please select a valid role." },
);

const employeeCodeField = z
  .string()
  .max(50, "Employee code must be no more than 50 characters.")
  .trim()
  .optional()
  .transform((v) => v || undefined);

const phoneField = z
  .string()
  .max(30, "Phone number must be no more than 30 characters.")
  .trim()
  .optional()
  .transform((v) => v || undefined);

const designationField = z
  .string()
  .max(100, "Designation must be no more than 100 characters.")
  .trim()
  .optional()
  .transform((v) => v || undefined);

const departmentField = z
  .string()
  .max(100, "Department must be no more than 100 characters.")
  .trim()
  .optional()
  .transform((v) => v || undefined);

// ── Create User Schema ──────────────────────────────────────

export const createUserSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    role: roleField,
    isActive: z.boolean().default(true),
    employeeCode: employeeCodeField,
    phone: phoneField,
    designation: designationField,
    department: departmentField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ── Update User Schema ──────────────────────────────────────

export const updateUserSchema = z.object({
  id: z.string().min(1, "User ID is required."),
  name: nameField,
  email: emailField,
  role: roleField,
  isActive: z.boolean(),
  employeeCode: employeeCodeField,
  phone: phoneField,
  designation: designationField,
  department: departmentField,
  image: z
    .string()
    .url("Please enter a valid image URL.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

// ── Change Role Schema ──────────────────────────────────────

export const changeRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  newRole: roleField,
});

export type ChangeRoleFormValues = z.infer<typeof changeRoleSchema>;

// ── Toggle Status Schema ────────────────────────────────────

export const toggleStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  isActive: z.boolean(),
});
