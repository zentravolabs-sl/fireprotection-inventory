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
import { getSession } from "@/lib/session";
import { ProjectDetailsClient } from "./ProjectDetailsClient";

import { getProjectStaff } from "@/lib/repositories/staffRepository";

export const dynamic = "force-dynamic";

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

  const session = await getSession();
  const currentUserRole = (session?.user as any)?.role ?? "USER";

  const project = await findProjectById(projectId);

  if (!project) {
    notFound();
  }

  const [
    timeline,
    inventoryItems,
    allUsers,
    toolAssignments,
    projectLabours,
    projectStaff,
    projectTransfers,
    allProjects,
    projectFireExtinguishers,
  ] = await Promise.all([
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
      select: { id: true, name: true, role: true, email: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    getProjectToolAssignments(projectId),
    prisma.projectLabour.findMany({
      where: { projectId },
      include: {
        labour: {
          include: { labourType: { select: { id: true, name: true } } },
        },
        assignedByUser: { select: { id: true, name: true } },
        overtimes: {
          include: { createdByUser: { select: { id: true, name: true } } },
          orderBy: { otDate: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    getProjectStaff(projectId),
    prisma.projectTransfer.findMany({
      where: {
        OR: [{ fromProjectId: projectId }, { toProjectId: projectId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromProject: { select: { id: true, projectCode: true, projectName: true } },
        toProject: { select: { id: true, projectCode: true, projectName: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        items: {
          include: {
            inventory: { select: { id: true, itemCode: true, name: true, unit: true } },
            pipeCutPiece: { select: { id: true, pieceLength: true, unit: true } },
            tool: { select: { id: true, toolCode: true, name: true } },
          },
        },
      },
    }),
    prisma.project.findMany({
      select: { id: true, projectCode: true, projectName: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fireExtinguisherAssignment.findMany({
      where: { projectId },
      include: {
        fireExtinguisherUnit: {
          include: { inventory: true },
        },
        refills: { orderBy: { receivedDate: "desc" }, take: 1 },
      },
      orderBy: { assignedDate: "desc" },
    }),
  ]);

  // Labours that are available for assignment to this project:
  // active AND not currently ACTIVE on any project
  const assignedActiveLabourIds = await prisma.projectLabour.findMany({
    where: { releaseStatus: "ACTIVE" },
    select: { labourId: true },
  });
  const busyIds = assignedActiveLabourIds.map((r) => r.labourId);

  const availableLabours = await prisma.labour.findMany({
    where: {
      isActive: true,
      id: { notIn: busyIds.length > 0 ? busyIds : [-1] },
    },
    include: { labourType: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  // Build estimate & already-requested maps for the MaterialRequestModal
  const [projectEstimates, existingRequestItems] = await Promise.all([
    prisma.projectEstimateMaterial.findMany({
      where: { projectId },
      select: { inventoryId: true, estimatedQty: true },
    }),
    prisma.materialRequestItem.findMany({
      where: {
        materialRequest: {
          projectId,
          status: { notIn: ["REJECTED"] },
        },
      },
      select: { inventoryId: true, qtyRequested: true },
    }),
  ]);

  const estimateMap: Record<number, number> = {};
  projectEstimates.forEach((e) => { estimateMap[e.inventoryId] = e.estimatedQty; });

  const requestedMap: Record<number, number> = {};
  existingRequestItems.forEach((ri) => {
    requestedMap[ri.inventoryId] = (requestedMap[ri.inventoryId] || 0) + ri.qtyRequested;
  });

  const formattedInventory = (inventoryItems || []).map((item: any) => {
    const estimatedQty = estimateMap[item.id] ?? null;
    const alreadyRequestedQty = requestedMap[item.id] ?? 0;
    const remainingEstimate =
      estimatedQty !== null ? Math.max(0, estimatedQty - alreadyRequestedQty) : null;
    return {
      id: item.id,
      itemCode: item.itemCode,
      name: item.name,
      unit: item.unit,
      availableStock: (item.stockBatches || []).reduce((sum: number, b: any) => sum + (b.availableQty || 0), 0),
      estimatedQty,
      alreadyRequestedQty,
      remainingEstimate,
    };
  });

  return (
    <ProjectDetailsClient
      project={project as any}
      timeline={timeline || []}
      inventoryItems={formattedInventory}
      users={allUsers || []}
      toolAssignments={(toolAssignments || []) as any}
      projectLabours={(projectLabours || []) as any}
      availableLabours={(availableLabours || []) as any}
      projectStaff={(projectStaff || []) as any}
      projectTransfers={(projectTransfers || []) as any}
      projectFireExtinguishers={(projectFireExtinguishers || []) as any}
      allProjects={allProjects || []}
      currentUserRole={currentUserRole}
    />
  );
}
