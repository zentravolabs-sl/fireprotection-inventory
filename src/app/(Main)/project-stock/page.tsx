// ============================================================
// src/app/(Main)/project-stock/page.tsx
// Central Project Stock & Materials Return Page
// ============================================================

import React from "react";
import { prisma } from "@/lib/prisma";
import { ProjectStockClientTable } from "./ProjectStockClientTable";

import { getSession } from "@/lib/session";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectStockPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search?.trim() || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 5;

  const session = await getSession();
  const user = session?.user as any;
  const userRole = user?.role;
  const userId = user?.id;

  const conditions: any[] = [];

  if (search) {
    conditions.push({
      OR: [
        { project: { projectName: { contains: search, mode: "insensitive" as const } } },
        { project: { projectCode: { contains: search, mode: "insensitive" as const } } },
        { inventory: { name: { contains: search, mode: "insensitive" as const } } },
        { inventory: { itemCode: { contains: search, mode: "insensitive" as const } } },
      ],
    });
  }

  if (userRole === "ENGINEER") {
    conditions.push({
      project: {
        engineers: {
          some: {
            engineerId: userId,
          },
        },
      },
    });
  }

  if (userRole === "PROJECT_MANAGER") {
    conditions.push({
      project: {
        projectManagerId: userId,
      },
    });
  }

  const whereCondition = conditions.length > 0 ? { AND: conditions } : {};

  const total = await prisma.projectMaterial.count({
    where: whereCondition,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * limit;

  const projectMaterials = await prisma.projectMaterial.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
          projectCode: true,
        },
      },
      inventory: {
        select: {
          id: true,
          name: true,
          itemCode: true,
          unit: true,
        },
      },
      materialIssueItem: {
        include: {
          stockBatch: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Assigned Project Stock
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track all inventory items currently issued and assigned to active projects.
        </p>
      </div>

      <ProjectStockClientTable
        projectMaterials={projectMaterials as any}
        total={total}
        page={currentPage}
        limit={limit}
        totalPages={totalPages}
        currentSearch={search}
      />
    </div>
  );
}

