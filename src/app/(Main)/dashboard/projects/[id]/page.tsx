// ============================================================
// src/app/(Main)/dashboard/projects/[id]/page.tsx
// Project Details Page with 6 Tabs & Action Dialogs
// ============================================================

import React from "react";
import { notFound } from "next/navigation";
import { findProjectById } from "@/lib/repositories/projectRepository";
import { getProjectTimelineService } from "@/lib/services/projectService";
import { getProjectToolAssignments } from "@/lib/repositories/toolAssignmentRepository";
import { prisma } from "@/lib/prisma";
import { ProjectDetailsClient } from "./ProjectDetailsClient";

export const revalidate = 0;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage(props: PageProps) {
  const params = await props.params;
  const projectId = Number(params.id);

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await findProjectById(projectId);

  if (!project) {
    notFound();
  }

  const [timeline, inventoryItems, allUsers, toolAssignments] = await Promise.all([
    getProjectTimelineService(projectId),
    prisma.inventory.findMany({
      select: {
        id: true,
        itemCode: true,
        name: true,
        unit: true,
        stockBatches: {
          select: { availableQty: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    }),
    getProjectToolAssignments(projectId),
  ]);

  const formattedInventory = inventoryItems.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    unit: item.unit,
    availableStock: item.stockBatches.reduce((sum, b) => sum + b.availableQty, 0),
  }));

  return (
    <ProjectDetailsClient
      project={project as any}
      timeline={timeline}
      inventoryItems={formattedInventory}
      users={allUsers}
      toolAssignments={toolAssignments as any}
    />
  );
}
