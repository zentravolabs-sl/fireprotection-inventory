"use server";

// ============================================================
// src/app/(Main)/admin/tools/actions.ts
// Server Actions for Tool CRUD, search, and filtering.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toolSchema, updateToolSchema } from "@/lib/validations/tool";
import type { ActionState } from "@/types/auth";
import type { ToolCondition, ToolStatus } from "@/generated/prisma/client";

const TOOLS_PATH = "/admin/tools";

// ── Types ────────────────────────────────────────────────────

export type ToolRow = {
  Id: number;
  ToolCode: string;
  Name: string;
  SerialNo: string;
  Condition: ToolCondition;
  Status: ToolStatus;
  image_url: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FilterParams = {
  search?: string;
  condition?: ToolCondition;
  status?: ToolStatus;
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("ToolCode") || msg.includes("tool_code")) {
      return "A tool with this Tool Code already exists.";
    }
    if (msg.includes("SerialNo") || msg.includes("serial_no")) {
      return "A tool with this Serial Number already exists.";
    }
  }
  console.error("[Tool Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const toolSelect = {
  Id: true,
  ToolCode: true,
  Name: true,
  SerialNo: true,
  Condition: true,
  Status: true,
  image_url: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── Queries ──────────────────────────────────────────────────

/**
 * Fetch tools with search & filtering by condition & status.
 * Returns newest first.
 */
export async function getTools(filters?: FilterParams): Promise<ToolRow[]> {
  const search = filters?.search?.trim();
  const condition = filters?.condition;
  const status = filters?.status;

  const where: any = {};

  if (condition) where.Condition = condition;
  if (status) where.Status = status;

  if (search) {
    where.OR = [
      { ToolCode: { contains: search, mode: "insensitive" } },
      { Name: { contains: search, mode: "insensitive" } },
      { SerialNo: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.tool.findMany({
    where,
    select: toolSelect,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fast search query for autocomplete/search suggestions.
 */
export async function searchTools(query: string): Promise<ToolRow[]> {
  const trimmed = query.trim();
  return prisma.tool.findMany({
    where: trimmed
      ? {
          OR: [
            { ToolCode: { contains: trimmed, mode: "insensitive" } },
            { Name: { contains: trimmed, mode: "insensitive" } },
            { SerialNo: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: toolSelect,
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single tool by Id.
 */
export async function getToolById(id: number): Promise<ToolRow | null> {
  return prisma.tool.findUnique({
    where: { Id: id },
    select: toolSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new Tool record.
 */
export async function createTool(
  formData: unknown
): Promise<ActionState<ToolRow>> {
  const parsed = toolSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[createTool Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Unique ToolCode check
  const existingCode = await prisma.tool.findUnique({
    where: { ToolCode: data.ToolCode },
    select: { Id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Tool Code must be unique.",
      errors: { ToolCode: ["A tool with this Tool Code already exists."] },
    };
  }

  // Unique SerialNo check
  const existingSerial = await prisma.tool.findUnique({
    where: { SerialNo: data.SerialNo },
    select: { Id: true },
  });
  if (existingSerial) {
    return {
      success: false,
      message: "Serial Number must be unique.",
      errors: { SerialNo: ["A tool with this Serial Number already exists."] },
    };
  }

  try {
    const tool = await prisma.tool.create({
      data: {
        ToolCode: data.ToolCode,
        Name: data.Name,
        SerialNo: data.SerialNo,
        Condition: data.Condition,
        Status: data.Status,
        image_url: data.image_url || null,
      },
      select: toolSelect,
    });

    revalidatePath(TOOLS_PATH);
    return {
      success: true,
      message: "Tool Created Successfully",
      data: tool,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing Tool record by Id.
 */
export async function updateTool(
  formData: unknown
): Promise<ActionState<ToolRow>> {
  const parsed = updateToolSchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstErrorMessage = Object.values(errors).flat()[0] || "Validation failed.";
    console.error("[updateTool Validation Error]", errors);
    return { success: false, message: firstErrorMessage, errors };
  }

  const data = parsed.data;

  // Unique ToolCode check for other records
  const existingCode = await prisma.tool.findFirst({
    where: { ToolCode: data.ToolCode, NOT: { Id: data.Id } },
    select: { Id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Tool Code must be unique.",
      errors: { ToolCode: ["Another tool with this Tool Code already exists."] },
    };
  }

  // Unique SerialNo check for other records
  const existingSerial = await prisma.tool.findFirst({
    where: { SerialNo: data.SerialNo, NOT: { Id: data.Id } },
    select: { Id: true },
  });
  if (existingSerial) {
    return {
      success: false,
      message: "Serial Number must be unique.",
      errors: { SerialNo: ["Another tool with this Serial Number already exists."] },
    };
  }

  try {
    const tool = await prisma.tool.update({
      where: { Id: data.Id },
      data: {
        ToolCode: data.ToolCode,
        Name: data.Name,
        SerialNo: data.SerialNo,
        Condition: data.Condition,
        Status: data.Status,
        image_url: data.image_url || null,
      },
      select: toolSelect,
    });

    revalidatePath(TOOLS_PATH);
    return {
      success: true,
      message: "Tool Updated Successfully",
      data: tool,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete a Tool record by Id.
 */
export async function deleteTool(id: number): Promise<ActionState> {
  try {
    await prisma.tool.delete({ where: { Id: id } });
    revalidatePath(TOOLS_PATH);
    return {
      success: true,
      message: "Tool Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
