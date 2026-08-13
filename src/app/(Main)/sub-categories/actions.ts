"use server";

// ============================================================
// src/app/(Main)/sub-categories/actions.ts
// Server Actions for SubCategory CRUD operations.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { subCategorySchema, updateSubCategorySchema } from "@/lib/validations/subcategory";
import type { ActionState } from "@/types/auth";

const SUBCATEGORIES_PATH = "/sub-categories";

// ── Types ────────────────────────────────────────────────────

export type SubCategoryRow = {
  id: number;
  name: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    categoryName: string;
  };
};

// ── Helpers ──────────────────────────────────────────────────

function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (
      msg.includes("sub_category_category_id_name") ||
      msg.includes("categoryId") ||
      msg.includes("name")
    ) {
      return "A sub-category with this name already exists in the selected category.";
    }
  }
  if (msg.includes("Record to update not found") || msg.includes("Record to delete does not exist")) {
    return "Record not found. It may have been already deleted.";
  }
  console.error("[SubCategory Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

const subCategorySelect = {
  id: true,
  name: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, categoryName: true },
  },
} as const;

// ── Queries ──────────────────────────────────────────────────

export interface GetSubCategoriesParams {
  search?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export interface GetSubCategoriesResult {
  subCategories: SubCategoryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch sub-categories with server-side pagination.
 */
export async function getSubCategories({
  search,
  categoryId,
  page = 1,
  limit = 5,
}: GetSubCategoriesParams = {}): Promise<GetSubCategoriesResult> {
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { category: { categoryName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, subCategories] = await Promise.all([
    prisma.subCategory.count({ where }),
    prisma.subCategory.findMany({
      where,
      select: subCategorySelect,
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    subCategories,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new SubCategory.
 */
export async function createSubCategory(
  formData: unknown,
): Promise<ActionState<SubCategoryRow>> {
  const parsed = subCategorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { categoryId, name } = parsed.data;

  // Verify parent category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    return { success: false, message: "Selected category does not exist." };
  }

  try {
    const subCategory = await prisma.subCategory.create({
      data: { categoryId, name },
      select: subCategorySelect,
    });

    revalidatePath(SUBCATEGORIES_PATH);
    return {
      success: true,
      message: "Sub-category created successfully.",
      data: subCategory,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing SubCategory by ID.
 */
export async function updateSubCategory(
  formData: unknown,
): Promise<ActionState<SubCategoryRow>> {
  const parsed = updateSubCategorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { id, categoryId, name } = parsed.data;

  try {
    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: { categoryId, name },
      select: subCategorySelect,
    });

    revalidatePath(SUBCATEGORIES_PATH);
    return {
      success: true,
      message: "Sub-category updated successfully.",
      data: subCategory,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete a SubCategory by ID.
 */
export async function deleteSubCategory(id: number): Promise<ActionState> {
  try {
    await prisma.subCategory.delete({ where: { id } });
    revalidatePath(SUBCATEGORIES_PATH);
    return { success: true, message: "Sub-category deleted successfully." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
