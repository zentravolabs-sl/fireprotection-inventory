// ============================================================
// src/lib/validations/fire-extinguisher.ts
// Zod schemas for Fire Extinguisher module validation.
// ============================================================

import { z } from "zod";

export const createFireExtinguisherUnitSchema = z.object({
  unitCode: z
    .string()
    .min(2, "Unit Code must be at least 2 characters")
    .max(50, "Unit Code cannot exceed 50 characters")
    .trim(),
  inventoryId: z.coerce.number().int().positive("Please select a master inventory item"),
  serialNumber: z.string().trim().optional().or(z.literal("")),
  manufactureDate: z.string().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const updateFireExtinguisherUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
  serialNumber: z.string().trim().optional().or(z.literal("")),
  manufactureDate: z.string().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["AVAILABLE", "ASSIGNED", "UNDER_REFILL", "TEMPORARY_REPLACEMENT", "DAMAGED", "LOST", "RETIRED"]).optional(),
});

export const createDeliveryNoteSchema = z.object({
  customerId: z.coerce.number().int().positive("Please select a customer"),
  deliveryDate: z.string().optional().or(z.literal("")),
  deliveryAddress: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  unitIds: z.array(z.coerce.number().int().positive()).min(1, "Select at least one fire extinguisher unit"),
});

export const updateDeliveryNoteSchema = z.object({
  id: z.coerce.number().int().positive(),
  customerId: z.coerce.number().int().positive().optional(),
  deliveryDate: z.string().optional().or(z.literal("")),
  deliveryAddress: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  unitIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const startRefillSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
  receivedDate: z.string().optional().or(z.literal("")),
  replacementUnitId: z.coerce.number().int().positive().optional().or(z.literal(0)),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const completeRefillSchema = z.object({
  refillId: z.coerce.number().int().positive(),
  completedDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const returnUnitSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
  returnedDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const assignUnitSchema = z.object({
  unitId: z.coerce.number().int().positive("Select a physical unit"),
  projectId: z.coerce.number().int().positive().optional().or(z.literal(0)),
  customerId: z.coerce.number().int().positive().optional().or(z.literal(0)),
  location: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
}).refine(
  (data) => (Boolean(data.projectId) && !data.customerId) || (!data.projectId && Boolean(data.customerId)),
  {
    message: "Specify either a Project OR a Customer (exactly one target).",
    path: ["projectId"],
  }
);
