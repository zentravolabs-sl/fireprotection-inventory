"use server";

// ============================================================
// src/app/(Main)/tools/actions.ts
// Server Actions for Tool CRUD, search, and filtering.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toolSchema, updateToolSchema } from "@/lib/validations/tool";
import type { ActionState } from "@/types/auth";
import type { ToolCondition, ToolStatus } from "@/generated/prisma/client";

const TOOLS_PATH = "/tools";

// ── Types ────────────────────────────────────────────────────

export type ToolRow = {
  id: number;
  toolCode: string;
  name: string;
  serialNo: string;
  condition: ToolCondition;
  status: ToolStatus;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentAssignment?: {
    project: { id: number; projectCode: string; projectName: string; location: string | null } | null;
    engineer: { id: string; name: string } | null;
  } | null;
};

export type FilterParams = {
  search?: string;
  condition?: ToolCondition;
  status?: ToolStatus;
  page?: number;
  limit?: number;
};

export interface GetToolsResult {
  tools: ToolRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("toolCode") || msg.includes("tool_code")) {
      return "A tool with this Tool Code already exists.";
    }
    if (msg.includes("serialNo") || msg.includes("serial_no")) {
      return "A tool with this Serial Number already exists.";
    }
  }
  console.error("[Tool Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const toolSelect = {
  id: true,
  toolCode: true,
  name: true,
  serialNo: true,
  condition: true,
  status: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getTools(filters: FilterParams = {}): Promise<GetToolsResult> {
  const search = filters.search?.trim();
  const condition = filters.condition;
  const status = filters.status;
  const page = Math.max(1, filters.page || 1);
  const limit = filters.limit || 5;

  const where: any = {};

  if (condition) where.condition = condition;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { toolCode: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { serialNo: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rawTools] = await Promise.all([
    prisma.tool.count({ where }),
    prisma.tool.findMany({
      where,
      select: {
        ...toolSelect,
        assignmentItems: {
          where: {
            returnedAt: null,
            toolAssignment: { status: "ACTIVE" },
          },
          take: 1,
          select: {
            toolAssignment: {
              select: {
                project: {
                  select: { id: true, projectCode: true, projectName: true, location: true },
                },
                engineer: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const tools = rawTools.map((t) => {
    const activeItem = t.assignmentItems[0];
    const { assignmentItems: _, ...rest } = t;
    return {
      ...rest,
      currentAssignment: activeItem
        ? {
            project: activeItem.toolAssignment.project,
            engineer: activeItem.toolAssignment.engineer,
          }
        : null,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    tools,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

export async function searchTools(query: string): Promise<ToolRow[]> {
  const trimmed = query.trim();
  return prisma.tool.findMany({
    where: trimmed
      ? {
          OR: [
            { toolCode: { contains: trimmed, mode: "insensitive" } },
            { name: { contains: trimmed, mode: "insensitive" } },
            { serialNo: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: toolSelect,
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

export async function getToolById(id: number): Promise<ToolRow | null> {
  return prisma.tool.findUnique({
    where: { id },
    select: toolSelect,
  });
}

// ── Mutations ────────────────────────────────────────────────

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

  const existingCode = await prisma.tool.findUnique({
    where: { toolCode: data.toolCode },
    select: { id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Tool Code must be unique.",
      errors: { toolCode: ["A tool with this Tool Code already exists."] },
    };
  }

  const existingSerial = await prisma.tool.findUnique({
    where: { serialNo: data.serialNo },
    select: { id: true },
  });
  if (existingSerial) {
    return {
      success: false,
      message: "Serial Number must be unique.",
      errors: { serialNo: ["A tool with this Serial Number already exists."] },
    };
  }

  try {
    const tool = await prisma.tool.create({
      data: {
        toolCode: data.toolCode,
        name: data.name,
        serialNo: data.serialNo,
        condition: data.condition,
        status: data.status,
        imageUrl: data.imageUrl || null,
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

  const existingCode = await prisma.tool.findFirst({
    where: { toolCode: data.toolCode, NOT: { id: data.id } },
    select: { id: true },
  });
  if (existingCode) {
    return {
      success: false,
      message: "Tool Code must be unique.",
      errors: { toolCode: ["Another tool with this Tool Code already exists."] },
    };
  }

  const existingSerial = await prisma.tool.findFirst({
    where: { serialNo: data.serialNo, NOT: { id: data.id } },
    select: { id: true },
  });
  if (existingSerial) {
    return {
      success: false,
      message: "Serial Number must be unique.",
      errors: { serialNo: ["Another tool with this Serial Number already exists."] },
    };
  }

  try {
    const tool = await prisma.tool.update({
      where: { id: data.id },
      data: {
        toolCode: data.toolCode,
        name: data.name,
        serialNo: data.serialNo,
        condition: data.condition,
        status: data.status,
        imageUrl: data.imageUrl || null,
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

export async function deleteTool(id: number): Promise<ActionState> {
  try {
    await prisma.tool.delete({ where: { id } });
    revalidatePath(TOOLS_PATH);
    return {
      success: true,
      message: "Tool Deleted Successfully",
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
