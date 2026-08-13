"use server";

// ============================================================
// src/app/(Main)/categories/actions.ts
// Server Actions for Category CRUD operations.
// Uses Prisma 7 with pg adapter — no direct URL in queries.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema, updateCategorySchema } from "@/lib/validations/category";
import type { ActionState } from "@/types/auth";
import type { Category } from "@/generated/prisma/client";

const CATEGORIES_PATH = "/categories";

// ── Types ────────────────────────────────────────────────────

export type CategoryRow = Pick<Category, "id" | "categoryName" | "createdAt" | "updatedAt">;

// ── Helpers ──────────────────────────────────────────────────

/** Maps Prisma unique constraint violation to a friendly message. */
function mapPrismaError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
    if (msg.includes("categoryName") || msg.includes("category_category_name")) {
      return "A category with this name already exists.";
    }
  }
  console.error("[Category Action Error]", err);
  return "An unexpected error occurred. Please try again.";
}

// ── Queries ──────────────────────────────────────────────────

export interface GetCategoriesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetCategoriesResult {
  categories: CategoryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch categories with server-side pagination & optional search filter.
 */
export async function getCategories({
  search,
  page = 1,
  limit = 5,
}: GetCategoriesParams = {}): Promise<GetCategoriesResult> {
  const where = search
    ? {
        categoryName: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : undefined;

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      select: {
        id: true,
        categoryName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    categories,
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
  };
}

// ── Mutations ────────────────────────────────────────────────

/**
 * Create a new Category.
 */
export async function createCategory(
  formData: unknown,
): Promise<ActionState<CategoryRow>> {
  // Validate input
  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { categoryName } = parsed.data;

  try {
    const category = await prisma.category.create({
      data: { categoryName },
      select: { id: true, categoryName: true, createdAt: true, updatedAt: true },
    });

    revalidatePath(CATEGORIES_PATH);
    return {
      success: true,
      message: "Category created successfully.",
      data: category,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Update an existing Category by ID.
 */
export async function updateCategory(
  formData: unknown,
): Promise<ActionState<CategoryRow>> {
  const parsed = updateCategorySchema.safeParse(formData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "Validation failed.", errors };
  }

  const { id, categoryName } = parsed.data;

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { categoryName },
      select: { id: true, categoryName: true, createdAt: true, updatedAt: true },
    });

    revalidatePath(CATEGORIES_PATH);
    return {
      success: true,
      message: "Category updated successfully.",
      data: category,
    };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}

/**
 * Delete a Category by ID.
 * Blocked if the category has any sub-categories.
 */
export async function deleteCategory(id: number): Promise<ActionState> {
  // Guard: prevent orphaned sub-categories
  const subCount = await prisma.subCategory.count({ where: { categoryId: id } });
  if (subCount > 0) {
    return {
      success: false,
      message: `Cannot delete — this category has ${subCount} sub-categor${subCount === 1 ? "y" : "ies"}. Remove them first.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath(CATEGORIES_PATH);
    return { success: true, message: "Category deleted successfully." };
  } catch (err) {
    return { success: false, message: mapPrismaError(err) };
  }
}
