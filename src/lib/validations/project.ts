// ============================================================
// src/lib/validations/project.ts
// Zod Validation Schemas for Project Management
// ============================================================

import { z } from "zod";

export const baseProjectSchema = z.object({
  projectName: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .trim(),
  customerId: z.coerce
    .number({ message: "Customer is required" })
    .int()
    .positive("Customer is required"),
  projectManagerId: z.string().min(1, "Project Manager is required"),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  projectValue: z.coerce
    .number({ message: "Project Value is required" })
    .min(0, "Project Value cannot be negative"),
  estimatedMaterialCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative")
    .default(0),
  estimatedLabourCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative")
    .default(0),
  estimatedTransportCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative")
    .default(0),
  estimatedEquipmentCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative")
    .default(0),
  estimatedOtherCost: z.coerce
    .number()
    .min(0, "Estimated cost cannot be negative")
    .default(0),
});

export const createProjectSchema = baseProjectSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date cannot be earlier than start date",
    path: ["endDate"],
  }
);

export const updateProjectSchema = baseProjectSchema.partial().extend({
  id: z.number().int().positive(),
  status: z
    .enum([
      "PENDING",
      "MATERIAL_REQUEST",
      "MATERIAL_APPROVED",
      "MATERIAL_ISSUED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
});

export const updateProjectCostsSchema = z.object({
  projectId: z.number().int().positive(),
  projectValue: z.number().min(0, "Project Value cannot be negative").default(0),
  estimatedMaterialCost: z.number().min(0),
  estimatedLabourCost: z.number().min(0),
  estimatedTransportCost: z.number().min(0),
  estimatedEquipmentCost: z.number().min(0),
  estimatedOtherCost: z.number().min(0),
});

export const assignEngineerSchema = z.object({
  projectId: z.number().int().positive(),
  engineerId: z.string().min(1, "Engineer selection is required"),
  isLead: z.boolean().default(false),
});

export const assignStaffSchema = z.object({
  projectId: z.number().int().positive(),
  projectManagerId: z.string().min(1, "Project Manager is required"),
});

export const createTransportSchema = z.object({
  projectId: z.number().int().positive(),
  transportDate: z.string().optional().nullable(),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  transportCompany: z.string().optional().nullable(),
  fromLocation: z.string().min(1, "Dispatch location is required"),
  toLocation: z.string().min(1, "Destination location is required"),
  fuelCost: z.number().min(0).default(0),
  vehicleHireCost: z.number().min(0).default(0),
  loadingCost: z.number().min(0).default(0),
  unloadingCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
  remarks: z.string().optional().nullable(),
});

export const createExpenseSchema = z.object({
  projectId: z.number().int().positive(),
  expenseType: z.enum(["MATERIAL", "LABOUR", "TRANSPORT", "EQUIPMENT", "OTHER"]),
  amount: z.number().positive("Amount must be greater than 0"),
  expenseDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
});

export const createMaterialRequestItemSchema = z.object({
  inventoryId: z.number().int().positive("Select a valid item"),
  qtyRequested: z.number().positive("Quantity requested must be greater than 0"),
});

export const createMaterialRequestSchema = z.object({
  projectId: z.number().int().positive("Select a project"),
  engineerId: z.string().min(1, "Engineer ID is required"),
  remarks: z.string().optional().nullable(),
  items: z.array(createMaterialRequestItemSchema).min(1, "At least one item is required"),
});

export const approveMaterialRequestItemSchema = z.object({
  itemId: z.number().int().positive(),
  qtyApproved: z.number().min(0, "Quantity approved cannot be negative"),
});

export const approveMaterialRequestSchema = z.object({
  requestId: z.number().int().positive(),
  items: z.array(approveMaterialRequestItemSchema).min(1, "At least one item required"),
  remarks: z.string().optional().nullable(),
});

export const issueMaterialsFIFOSchema = z.object({
  requestId: z.number().int().positive(),
  warehouse: z.string().optional().nullable(),
});

export const returnMaterialItemSchema = z.object({
  projectMaterialId: z.number().int().positive(),
  inventoryId: z.number().int().positive(),
  qtyReturned: z.number().positive("Return quantity must be greater than 0"),
  condition: z.enum(["GOOD", "DAMAGED", "SCRAP"]),
});

export const returnMaterialsSchema = z.object({
  projectId: z.number().int().positive(),
  engineerId: z.string().min(1, "Engineer is required"),
  remarks: z.string().optional().nullable(),
  items: z.array(returnMaterialItemSchema).min(1, "At least one item to return"),
});

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type CreateProjectFormValues = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectCostsInput = z.infer<typeof updateProjectCostsSchema>;
export type AssignEngineerInput = z.infer<typeof assignEngineerSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type CreateTransportInput = z.infer<typeof createTransportSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateMaterialRequestInput = z.infer<typeof createMaterialRequestSchema>;
export type ApproveMaterialRequestInput = z.infer<typeof approveMaterialRequestSchema>;
export type IssueMaterialsFIFOInput = z.infer<typeof issueMaterialsFIFOSchema>;
export type ReturnMaterialsInput = z.infer<typeof returnMaterialsSchema>;
